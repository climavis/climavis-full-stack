#!/usr/bin/env python3
"""
Descarga histórica de datos climáticos de Open-Meteo (2000–2025)
para los 32 estados de México.

Estrategia v4 — Tor IP rotation:
  - Todas las 32 coordenadas en UNA sola request (multi-location).
  - 26 años = 26 requests totales.
  - Cada 2 requests, se rota el circuito Tor → nueva IP.
  - Ninguna IP hace más de 2-3 requests → imposible alcanzar rate-limit.
  - Reanudación automática: CSVs parciales por año.
  - Al final fusiona todos los parciales en un solo CSV.

Requisitos:
  sudo apt install tor
  pip install stem pysocks requests[socks] pandas

Resultado:
  Un CSV con ~303,000 filas (32 estados × 365 días × 26 años).
"""

import requests
import pandas as pd
import time
import os
import sys
import glob
import socket
import random
import string

# ═══════════════════════════════════════════════════════════════════════════════
# Coordenadas de las capitales de los 32 estados de México
# ═══════════════════════════════════════════════════════════════════════════════

STATES = [
    {"state": "Aguascalientes",      "lat": 21.8818, "lon": -102.2916},
    {"state": "Baja California",     "lat": 32.5027, "lon": -117.0037},
    {"state": "Baja California Sur", "lat": 24.1426, "lon": -110.3128},
    {"state": "Campeche",            "lat": 19.8455, "lon": -90.5297},
    {"state": "Chiapas",             "lat": 16.7570, "lon": -93.1292},
    {"state": "Chihuahua",           "lat": 28.6330, "lon": -106.0691},
    {"state": "Ciudad de México",    "lat": 19.4326, "lon": -99.1332},
    {"state": "Coahuila",            "lat": 25.4232, "lon": -100.9963},
    {"state": "Colima",              "lat": 19.2433, "lon": -103.7241},
    {"state": "Durango",             "lat": 24.0277, "lon": -104.6532},
    {"state": "Guanajuato",          "lat": 21.0190, "lon": -101.2574},
    {"state": "Guerrero",            "lat": 17.5506, "lon": -99.5024},
    {"state": "Hidalgo",             "lat": 20.1011, "lon": -98.7624},
    {"state": "Jalisco",             "lat": 20.6597, "lon": -103.3496},
    {"state": "México",              "lat": 19.2952, "lon": -99.8932},
    {"state": "Michoacán",           "lat": 19.7008, "lon": -101.1844},
    {"state": "Morelos",             "lat": 18.9242, "lon": -99.2216},
    {"state": "Nayarit",             "lat": 21.5085, "lon": -104.8954},
    {"state": "Nuevo León",          "lat": 25.6866, "lon": -100.3161},
    {"state": "Oaxaca",              "lat": 17.0732, "lon": -96.7266},
    {"state": "Puebla",              "lat": 19.0414, "lon": -98.2063},
    {"state": "Querétaro",           "lat": 20.5888, "lon": -100.3899},
    {"state": "Quintana Roo",        "lat": 21.1743, "lon": -86.8466},
    {"state": "San Luis Potosí",     "lat": 22.1565, "lon": -100.9855},
    {"state": "Sinaloa",             "lat": 24.8091, "lon": -107.3940},
    {"state": "Sonora",              "lat": 29.0729, "lon": -110.9559},
    {"state": "Tabasco",             "lat": 17.9869, "lon": -92.9303},
    {"state": "Tamaulipas",          "lat": 23.7369, "lon": -99.1411},
    {"state": "Tlaxcala",            "lat": 19.3139, "lon": -98.2404},
    {"state": "Veracruz",            "lat": 19.1738, "lon": -96.1342},
    {"state": "Yucatán",             "lat": 20.9674, "lon": -89.6237},
    {"state": "Zacatecas",           "lat": 22.7709, "lon": -102.5832},
]

# ═══════════════════════════════════════════════════════════════════════════════
# Configuración
# ═══════════════════════════════════════════════════════════════════════════════

VARIABLES = ",".join([
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_2m_mean",
    "relative_humidity_2m_max",
    "relative_humidity_2m_min",
    "relative_humidity_2m_mean",
    "precipitation_sum",
    "wind_speed_10m_max",
    "wind_speed_10m_mean",
    "wind_direction_10m_dominant",
    "shortwave_radiation_sum",
    "uv_index_max",
    "et0_fao_evapotranspiration",
])

BASE_URL   = "https://archive-api.open-meteo.com/v1/archive"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
START_YEAR = 2000
END_YEAR   = 2025

# Tor config
TOR_SOCKS_PORT = 9050

# Timing
MAX_RETRIES = 5
DELAY_BETWEEN_REQUESTS = 3.0   # Tor cambia IP, no necesitamos mucho delay
ROTATE_EVERY_N = 2             # Rotar IP cada N requests


# ═══════════════════════════════════════════════════════════════════════════════
# Tor helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _rand_id(n=12):
    """Genera un ID aleatorio para aislar circuitos Tor."""
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def get_tor_session() -> requests.Session:
    """Crea una sesión con credenciales SOCKS5 únicas → circuito Tor único → IP nueva.
    Tor asigna un circuito distinto por cada par user:pass diferente (IsolateSOCKSAuth).
    No requiere ControlPort."""
    session = requests.Session()
    user = _rand_id()
    pwd  = _rand_id()
    proxy = f"socks5h://{user}:{pwd}@127.0.0.1:{TOR_SOCKS_PORT}"
    session.proxies = {"http": proxy, "https": proxy}
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
        "Accept": "application/json",
    })
    return session


def get_current_ip(session: requests.Session) -> str:
    """Obtiene la IP actual visible desde la sesión."""
    try:
        r = session.get("https://api.ipify.org?format=json", timeout=15)
        return r.json().get("ip", "???")
    except Exception:
        return "???"


def check_tor_running() -> bool:
    """Verifica que el servicio Tor esté corriendo."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex(("127.0.0.1", TOR_SOCKS_PORT))
        sock.close()
        return result == 0
    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# Descarga
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_year(year: int, session: requests.Session) -> tuple[pd.DataFrame | None, requests.Session]:
    """Descarga datos de un año para TODOS los 32 estados en UNA request.
    Retorna (DataFrame o None, sesión posiblemente renovada)."""

    lats = ",".join(str(s["lat"]) for s in STATES)
    lons = ",".join(str(s["lon"]) for s in STATES)

    params = {
        "latitude":   lats,
        "longitude":  lons,
        "start_date": f"{year}-01-01",
        "end_date":   f"{year}-12-31",
        "daily":      VARIABLES,
        "timezone":   "America/Mexico_City",
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(BASE_URL, params=params, timeout=120)

            if r.status_code == 429:
                print(f"\n  ⏳ 429 en intento {attempt} — nueva sesión Tor…", end="", flush=True)
                session = get_tor_session()  # Nuevas credenciales = nuevo circuito = nueva IP
                ip = get_current_ip(session)
                print(f" IP: {ip}", flush=True)
                time.sleep(2)
                continue

            r.raise_for_status()
            data = r.json()

            if not isinstance(data, list):
                data = [data]

            dfs = []
            for i, loc in enumerate(data):
                daily = loc.get("daily")
                if not daily:
                    continue
                df = pd.DataFrame(daily)
                df["state"] = STATES[i]["state"]
                df["lat"]   = STATES[i]["lat"]
                df["lon"]   = STATES[i]["lon"]
                dfs.append(df)

            if dfs:
                return pd.concat(dfs, ignore_index=True), session
            return None, session

        except requests.exceptions.RequestException as e:
            if attempt < MAX_RETRIES:
                print(f"\n  ⚠️  Intento {attempt}/{MAX_RETRIES}: {e}", end="", flush=True)
                session = get_tor_session()  # Nueva IP en caso de error de red
                time.sleep(3)
            else:
                print(f"\n  ❌ Año {year} falló tras {MAX_RETRIES} intentos")
                return None, session

    return None, session


def year_already_downloaded(year: int) -> bool:
    """Verifica si ya existe el CSV parcial para este año."""
    path = os.path.join(OUTPUT_DIR, f"parcial_{year}.csv")
    if os.path.exists(path):
        try:
            df = pd.read_csv(path)
            # Considerar completo si tiene datos de al menos 30 estados
            return df["state"].nunique() >= 30
        except Exception:
            return False
    return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    years = list(range(START_YEAR, END_YEAR + 1))
    total_years = len(years)
    pending = [y for y in years if not year_already_downloaded(y)]

    print("=" * 64)
    print(f"  Open-Meteo Historical Fetcher v4 — Tor Edition")
    print(f"  {len(STATES)} estados × {total_years} años = {total_years} requests")
    print(f"  (32 coords por request, IP se rota cada {ROTATE_EVERY_N} reqs)")
    print(f"  Ya descargados: {total_years - len(pending)} / {total_years}")
    print(f"  Pendientes: {len(pending)} requests")
    print("=" * 64)

    # ── Verificar Tor ─────────────────────────────────────────────
    print(f"\nVerificando Tor…", end=" ", flush=True)
    if not check_tor_running():
        print("❌ Tor no está corriendo.")
        print("  Ejecuta: sudo systemctl start tor")
        print("  O bien:  sudo apt install tor && sudo systemctl start tor")
        sys.exit(1)
    print("✅ Tor activo en puerto", TOR_SOCKS_PORT)

    # ── Crear sesión Tor y verificar IP ───────────────────────────
    session = get_tor_session()
    ip = get_current_ip(session)
    print(f"  IP actual (Tor): {ip}")

    # ── Test de conectividad con Open-Meteo vía Tor ──────────────
    print(f"Probando Open-Meteo vía Tor…", end=" ", flush=True)
    try:
        tr = session.get(BASE_URL, params={
            "latitude": "19.43",
            "longitude": "-99.13",
            "start_date": "2024-01-01",
            "end_date": "2024-01-02",
            "daily": "temperature_2m_mean",
            "timezone": "America/Mexico_City",
        }, timeout=30)
        if tr.status_code == 200:
            print("✅ API disponible")
        elif tr.status_code == 429:
            print("429 en esta IP — nueva identidad…")
            session = get_tor_session()
            ip = get_current_ip(session)
            print(f"  Nueva IP: {ip}")
        else:
            print(f"⚠️  HTTP {tr.status_code}")
    except Exception as e:
        print(f"⚠️  {e} (continuamos de todos modos)")

    if not pending:
        print("\n✅ Todos los años ya están descargados. Fusionando…")
    else:
        t0 = time.time()
        requests_made = 0

        for i, year in enumerate(pending, 1):
            # Rotar IP cada N requests
            if requests_made > 0 and requests_made % ROTATE_EVERY_N == 0:
                print(f"  🔄 Nueva identidad Tor…", end="", flush=True)
                session = get_tor_session()
                ip = get_current_ip(session)
                print(f" IP: {ip}")

            print(f"[{i:2d}/{len(pending)}] {year}…", end=" ", flush=True)

            df, session = fetch_year(year, session)
            requests_made += 1

            if df is not None:
                partial_path = os.path.join(OUTPUT_DIR, f"parcial_{year}.csv")
                df.to_csv(partial_path, index=False)
                n_states = df["state"].nunique()
                rows = len(df)
                print(f"{n_states} estados, {rows:,} filas ✅")
            else:
                print(f"❌ sin datos")

            # Pausa entre requests
            if i < len(pending):
                time.sleep(DELAY_BETWEEN_REQUESTS)

        elapsed = time.time() - t0
        print(f"\nDescarga completada en {elapsed:.1f}s ({requests_made} requests)")

    # ── Fusionar todos los parciales ───────────────────────────────────────
    print(f"\nFusionando archivos parciales…")
    partial_files = sorted(glob.glob(os.path.join(OUTPUT_DIR, "parcial_*.csv")))

    if not partial_files:
        print("❌ No se encontraron archivos parciales.")
        sys.exit(1)

    all_dfs = []
    for f in partial_files:
        try:
            all_dfs.append(pd.read_csv(f))
        except Exception as e:
            print(f"  ⚠️  Error leyendo {f}: {e}")

    df = pd.concat(all_dfs, ignore_index=True)

    df.rename(columns={
        "time":                          "fecha",
        "temperature_2m_max":            "temp_max_c",
        "temperature_2m_min":            "temp_min_c",
        "temperature_2m_mean":           "temp_media_c",
        "relative_humidity_2m_max":      "humedad_max_pct",
        "relative_humidity_2m_min":      "humedad_min_pct",
        "relative_humidity_2m_mean":     "humedad_media_pct",
        "precipitation_sum":             "precipitacion_mm",
        "wind_speed_10m_max":            "viento_max_kmh",
        "wind_speed_10m_mean":           "viento_media_kmh",
        "wind_direction_10m_dominant":   "viento_dir_grados",
        "shortwave_radiation_sum":       "radiacion_solar_mj",
        "uv_index_max":                  "uv_index_max",
        "et0_fao_evapotranspiration":    "evapotranspiracion_mm",
    }, inplace=True)

    df.sort_values(["state", "fecha"], inplace=True)
    df.reset_index(drop=True, inplace=True)

    # ── Guardar CSV final ──────────────────────────────────────────────────
    output_path = os.path.join(OUTPUT_DIR, "clima_mexico_2000_2025.csv")
    df.to_csv(output_path, index=False)

    print()
    print("=" * 64)
    print(f"  ✅ Dataset guardado: {output_path}")
    print(f"  Total filas:   {len(df):>10,}")
    print(f"  Total estados: {df['state'].nunique():>10}")
    print(f"  Rango fechas:  {df['fecha'].min()} → {df['fecha'].max()}")
    years_in_data = sorted(df["fecha"].str[:4].unique())
    print(f"  Años:          {years_in_data[0]}–{years_in_data[-1]} ({len(years_in_data)} años)")
    print("=" * 64)

    # ── Resumen por estado ─────────────────────────────────────────────────
    print("\nResumen por estado:")
    summary = df.groupby("state").agg(
        filas=("fecha", "count"),
        fecha_min=("fecha", "min"),
        fecha_max=("fecha", "max"),
        temp_media=("temp_media_c", "mean"),
    ).round(1)
    print(summary.to_string())


if __name__ == "__main__":
    main()
