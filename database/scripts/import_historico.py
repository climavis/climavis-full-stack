#!/usr/bin/env python3
"""
Importa los datos históricos del CSV generado por fetch_openmeteo_historico.py
a la base de datos PostgreSQL de ClimaVis.

Funcionalidades:
  - Importa clima_mexico_2000_2025.csv (303,904 filas)
  - Mapea "México" → "Estado de México" para coincidir con la BD
  - Usa UPSERT (ON CONFLICT DO UPDATE) para no duplicar
  - Opcionalmente descarga datos faltantes hasta hoy vía Tor
  - Muestra progreso en tiempo real

Uso:
  python import_historico.py                      # Solo importa CSV existente
  python import_historico.py --fetch-latest       # Además descarga datos nuevos hasta hoy
  python import_historico.py --dry-run            # Solo muestra qué haría

Requisitos:
  pip install psycopg2-binary pandas
  (para --fetch-latest: tor corriendo + pip install requests[socks])
"""

import argparse
import os
import sys
import time
from datetime import date, timedelta

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ═══════════════════════════════════════════════════════════════════════════════
# Configuración
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
CSV_PATH = os.path.join(PROJECT_ROOT, "tests", "output", "clima_mexico_2000_2025.csv")

# PostgreSQL — mismas credenciales que docker-compose.yml
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "climavis")
DB_USER = os.environ.get("DB_USER", "climavis")
DB_PASS = os.environ.get("DB_PASS", "climavis_secret")

# Mapeo de nombres CSV → BD
STATE_NAME_MAP = {
    "México": "Estado de México",
}

# Batch size para INSERT
BATCH_SIZE = 5000

# ═══════════════════════════════════════════════════════════════════════════════
# Columnas CSV → columnas BD
# ═══════════════════════════════════════════════════════════════════════════════

CSV_TO_DB = {
    "fecha":              "date",
    "state":              "state",
    "temp_max_c":         "temp_max",
    "temp_min_c":         "temp_min",
    "temp_media_c":       "temp_mean",
    "precipitacion_mm":   "precipitation",
    "viento_max_kmh":     "wind_max",
    "viento_media_kmh":   "wind_gusts",      # Usamos wind_gusts para la media
    "viento_dir_grados":  "wind_direction",
    "humedad_max_pct":    "humidity_max",
    "humedad_min_pct":    "humidity_min",
    "humedad_media_pct":  "humidity_mean",
    "radiacion_solar_mj": "radiation",
}


def get_connection():
    """Crea conexión a PostgreSQL."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
    )


def get_db_date_range(conn) -> tuple:
    """Obtiene el rango de fechas actual en la BD."""
    with conn.cursor() as cur:
        cur.execute("SELECT MIN(date), MAX(date), COUNT(*) FROM climate_data")
        return cur.fetchone()


def import_csv(conn, csv_path: str, dry_run: bool = False):
    """Importa el CSV histórico a la BD usando UPSERT."""

    print(f"\n{'=' * 64}")
    print(f"  Importando datos históricos a PostgreSQL")
    print(f"{'=' * 64}")
    print(f"  CSV:  {csv_path}")
    print(f"  BD:   {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

    # Rango actual en BD
    min_date, max_date, count = get_db_date_range(conn)
    print(f"  BD actual: {min_date} → {max_date} ({count:,} registros)")

    # Leer CSV
    print(f"\n  Leyendo CSV…", end=" ", flush=True)
    df = pd.read_csv(csv_path)
    print(f"{len(df):,} filas, {df['state'].nunique()} estados")

    # Mapear nombres de estado
    df["state"] = df["state"].replace(STATE_NAME_MAP)
    print(f"  Mapeado 'México' → 'Estado de México'")

    # Seleccionar y renombrar columnas
    csv_cols = list(CSV_TO_DB.keys())
    db_cols = list(CSV_TO_DB.values())
    df_import = df[csv_cols].copy()
    df_import.columns = db_cols

    # Convertir fecha
    df_import["date"] = pd.to_datetime(df_import["date"]).dt.date

    # Reemplazar NaN con None para PostgreSQL
    df_import = df_import.where(pd.notnull(df_import), None)

    total_rows = len(df_import)
    print(f"  Filas a importar: {total_rows:,}")
    print(f"  Rango: {df_import['date'].min()} → {df_import['date'].max()}")

    if dry_run:
        print(f"\n  [DRY RUN] No se insertarán datos.")
        return 0

    # UPSERT en batches
    upsert_sql = """
        INSERT INTO climate_data (state, date, temp_max, temp_min, temp_mean,
                                  precipitation, wind_max, wind_gusts, wind_direction,
                                  humidity_max, humidity_min, humidity_mean, radiation)
        VALUES %s
        ON CONFLICT (state, date)
        DO UPDATE SET
            temp_max      = EXCLUDED.temp_max,
            temp_min      = EXCLUDED.temp_min,
            temp_mean     = EXCLUDED.temp_mean,
            precipitation = EXCLUDED.precipitation,
            wind_max      = EXCLUDED.wind_max,
            wind_gusts    = EXCLUDED.wind_gusts,
            wind_direction = EXCLUDED.wind_direction,
            humidity_max  = EXCLUDED.humidity_max,
            humidity_min  = EXCLUDED.humidity_min,
            humidity_mean = EXCLUDED.humidity_mean,
            radiation     = EXCLUDED.radiation,
            updated_at    = NOW()
    """

    inserted = 0
    t0 = time.time()

    with conn.cursor() as cur:
        # Procesar en batches
        for start in range(0, total_rows, BATCH_SIZE):
            batch = df_import.iloc[start:start + BATCH_SIZE]
            values = [
                (
                    row["state"], row["date"],
                    row["temp_max"], row["temp_min"], row["temp_mean"],
                    row["precipitation"],
                    row["wind_max"], row["wind_gusts"], row["wind_direction"],
                    row["humidity_max"], row["humidity_min"], row["humidity_mean"],
                    row["radiation"],
                )
                for _, row in batch.iterrows()
            ]
            execute_values(cur, upsert_sql, values, page_size=1000)
            inserted += len(values)

            pct = inserted / total_rows * 100
            elapsed = time.time() - t0
            rate = inserted / elapsed if elapsed > 0 else 0
            print(f"\r  Progreso: {inserted:>7,} / {total_rows:,} ({pct:5.1f}%) — {rate:,.0f} filas/s", end="", flush=True)

    conn.commit()
    elapsed = time.time() - t0
    print(f"\n\n  Importación completada en {elapsed:.1f}s")

    # Nuevo rango
    min_date, max_date, count = get_db_date_range(conn)
    print(f"  BD ahora: {min_date} → {max_date} ({count:,} registros)")

    return inserted


def fetch_and_import_latest(conn, dry_run: bool = False):
    """Descarga datos desde el último día en la BD hasta hoy vía Tor e importa."""
    import requests
    import random
    import string
    import socket

    print(f"\n{'=' * 64}")
    print(f"  Descargando datos faltantes hasta hoy")
    print(f"{'=' * 64}")

    # Obtener última fecha en BD
    _, max_date_db, _ = get_db_date_range(conn)
    today = date.today()

    if max_date_db and max_date_db >= today:
        print(f"  BD ya tiene datos hasta {max_date_db} (hoy: {today})")
        print(f"  No hay datos faltantes.")
        return 0

    # Rango a descargar
    start_date = (max_date_db + timedelta(days=1)) if max_date_db else date(2000, 1, 1)
    end_date = today

    # Si empezamos antes de 2026, necesitamos el endpoint de archivo para < 2026
    # y el de forecast para datos muy recientes
    print(f"  Rango faltante: {start_date} → {end_date}")
    days_missing = (end_date - start_date).days + 1
    print(f"  Días faltantes: {days_missing}")

    if days_missing <= 0:
        print(f"  No hay datos faltantes.")
        return 0

    # Verificar Tor
    TOR_PORT = 9050
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex(("127.0.0.1", TOR_PORT))
        sock.close()
        if result != 0:
            raise ConnectionError()
    except Exception:
        print(f"  Tor no está corriendo en puerto {TOR_PORT}.")
        print(f"  Ejecuta: sudo systemctl start tor")
        return 0

    print(f"  Tor activo")

    # Coordenadas de los estados (mismas que el script de fetch)
    states = [
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
        {"state": "Estado de México",    "lat": 19.2952, "lon": -99.8932},
        {"state": "Guanajuato",          "lat": 21.0190, "lon": -101.2574},
        {"state": "Guerrero",            "lat": 17.5506, "lon": -99.5024},
        {"state": "Hidalgo",             "lat": 20.1011, "lon": -98.7624},
        {"state": "Jalisco",             "lat": 20.6597, "lon": -103.3496},
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

    lats = ",".join(str(s["lat"]) for s in states)
    lons = ",".join(str(s["lon"]) for s in states)

    variables = ",".join([
        "temperature_2m_max", "temperature_2m_min", "temperature_2m_mean",
        "relative_humidity_2m_max", "relative_humidity_2m_min", "relative_humidity_2m_mean",
        "precipitation_sum", "wind_speed_10m_max", "wind_speed_10m_mean",
        "wind_direction_10m_dominant", "shortwave_radiation_sum",
    ])

    # Crear sesión Tor
    def new_tor_session():
        s = requests.Session()
        uid = "".join(random.choices(string.ascii_lowercase + string.digits, k=12))
        pwd = "".join(random.choices(string.ascii_lowercase + string.digits, k=12))
        proxy = f"socks5h://{uid}:{pwd}@127.0.0.1:{TOR_PORT}"
        s.proxies = {"http": proxy, "https": proxy}
        s.headers["User-Agent"] = "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/128.0"
        return s

    session = new_tor_session()

    # Determinar endpoints — archive for historical, forecast for recent
    # Open-Meteo archive covers up to ~5 days ago; forecast API has recent days
    five_days_ago = today - timedelta(days=5)

    all_dfs = []

    # Fetch from archive API if needed (datos < 5 días atrás)
    if start_date <= five_days_ago:
        archive_end = min(five_days_ago, end_date)
        print(f"\n  Descargando archivo: {start_date} → {archive_end}…", end=" ", flush=True)

        params = {
            "latitude": lats, "longitude": lons,
            "start_date": str(start_date), "end_date": str(archive_end),
            "daily": variables, "timezone": "America/Mexico_City",
        }

        for attempt in range(5):
            try:
                r = session.get("https://archive-api.open-meteo.com/v1/archive", params=params, timeout=120)
                if r.status_code == 429:
                    session = new_tor_session()
                    time.sleep(2)
                    continue
                r.raise_for_status()
                data = r.json()
                if not isinstance(data, list):
                    data = [data]

                for i, loc in enumerate(data):
                    daily = loc.get("daily")
                    if not daily:
                        continue
                    df = pd.DataFrame(daily)
                    df["state"] = states[i]["state"]
                    all_dfs.append(df)
                print(f"OK ({len(all_dfs)} estados)")
                break
            except Exception as e:
                print(f"intento {attempt+1}: {e}")
                session = new_tor_session()
                time.sleep(3)

    # Fetch from forecast API for recent days
    forecast_start = max(start_date, five_days_ago + timedelta(days=1))
    if forecast_start <= end_date:
        print(f"  Descargando forecast: {forecast_start} → {end_date}…", end=" ", flush=True)

        params = {
            "latitude": lats, "longitude": lons,
            "start_date": str(forecast_start), "end_date": str(end_date),
            "daily": variables, "timezone": "America/Mexico_City",
        }

        for attempt in range(5):
            try:
                r = session.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=120)
                if r.status_code == 429:
                    session = new_tor_session()
                    time.sleep(2)
                    continue
                r.raise_for_status()
                data = r.json()
                if not isinstance(data, list):
                    data = [data]

                count = 0
                for i, loc in enumerate(data):
                    daily = loc.get("daily")
                    if not daily:
                        continue
                    df = pd.DataFrame(daily)
                    df["state"] = states[i]["state"]
                    all_dfs.append(df)
                    count += 1
                print(f"OK ({count} estados)")
                break
            except Exception as e:
                print(f"intento {attempt+1}: {e}")
                session = new_tor_session()
                time.sleep(3)

    if not all_dfs:
        print(f"  No se obtuvieron datos nuevos.")
        return 0

    df_new = pd.concat(all_dfs, ignore_index=True)

    # Mapear columnas al formato de la BD
    col_map = {
        "time": "date",
        "temperature_2m_max": "temp_max",
        "temperature_2m_min": "temp_min",
        "temperature_2m_mean": "temp_mean",
        "precipitation_sum": "precipitation",
        "wind_speed_10m_max": "wind_max",
        "wind_speed_10m_mean": "wind_gusts",
        "wind_direction_10m_dominant": "wind_direction",
        "relative_humidity_2m_max": "humidity_max",
        "relative_humidity_2m_min": "humidity_min",
        "relative_humidity_2m_mean": "humidity_mean",
        "shortwave_radiation_sum": "radiation",
    }

    df_new.rename(columns=col_map, inplace=True)

    # Seleccionar solo las columnas que necesitamos
    keep_cols = ["state", "date", "temp_max", "temp_min", "temp_mean",
                 "precipitation", "wind_max", "wind_gusts", "wind_direction",
                 "humidity_max", "humidity_min", "humidity_mean", "radiation"]
    df_new = df_new[[c for c in keep_cols if c in df_new.columns]]

    df_new["date"] = pd.to_datetime(df_new["date"]).dt.date
    df_new = df_new.where(pd.notnull(df_new), None)

    total = len(df_new)
    print(f"\n  Filas nuevas a importar: {total:,}")

    if dry_run:
        print(f"  [DRY RUN] No se insertarán datos.")
        return 0

    # UPSERT
    upsert_sql = """
        INSERT INTO climate_data (state, date, temp_max, temp_min, temp_mean,
                                  precipitation, wind_max, wind_gusts, wind_direction,
                                  humidity_max, humidity_min, humidity_mean, radiation)
        VALUES %s
        ON CONFLICT (state, date)
        DO UPDATE SET
            temp_max      = EXCLUDED.temp_max,
            temp_min      = EXCLUDED.temp_min,
            temp_mean     = EXCLUDED.temp_mean,
            precipitation = EXCLUDED.precipitation,
            wind_max      = EXCLUDED.wind_max,
            wind_gusts    = EXCLUDED.wind_gusts,
            wind_direction = EXCLUDED.wind_direction,
            humidity_max  = EXCLUDED.humidity_max,
            humidity_min  = EXCLUDED.humidity_min,
            humidity_mean = EXCLUDED.humidity_mean,
            radiation     = EXCLUDED.radiation,
            updated_at    = NOW()
    """

    with conn.cursor() as cur:
        values = [
            (
                row["state"], row["date"],
                row.get("temp_max"), row.get("temp_min"), row.get("temp_mean"),
                row.get("precipitation"),
                row.get("wind_max"), row.get("wind_gusts"), row.get("wind_direction"),
                row.get("humidity_max"), row.get("humidity_min"), row.get("humidity_mean"),
                row.get("radiation"),
            )
            for _, row in df_new.iterrows()
        ]
        execute_values(cur, upsert_sql, values, page_size=1000)

    conn.commit()
    print(f"  Importados {total:,} registros nuevos")

    return total


def main():
    parser = argparse.ArgumentParser(description="Importa datos históricos a PostgreSQL")
    parser.add_argument("--fetch-latest", action="store_true",
                        help="Descarga datos faltantes hasta hoy via Tor")
    parser.add_argument("--dry-run", action="store_true",
                        help="Muestra qué haría sin modificar la BD")
    parser.add_argument("--csv", default=CSV_PATH,
                        help=f"Ruta al CSV (default: {CSV_PATH})")
    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"CSV no encontrado: {args.csv}")
        print(f"Ejecuta primero: python tests/fetch_openmeteo_historico.py")
        sys.exit(1)

    conn = get_connection()
    try:
        # 1. Importar CSV histórico
        import_csv(conn, args.csv, args.dry_run)

        # 2. Descargar datos más recientes si se solicita
        if args.fetch_latest:
            fetch_and_import_latest(conn, args.dry_run)

        # Resumen final
        min_date, max_date, count = get_db_date_range(conn)
        print(f"\n{'=' * 64}")
        print(f"  Resumen final de la BD")
        print(f"{'=' * 64}")
        print(f"  Rango:     {min_date} → {max_date}")
        print(f"  Registros: {count:,}")
        print(f"{'=' * 64}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
