"""
Cliente para la API gratuita de Open-Meteo con rotación de IP vía Tor.

Estrategia anti-rate-limit:
  1. Proxy SOCKS5 a través de Tor con IsolateSOCKSAuth.
     Cada par usuario:contraseña aleatorio genera un circuito Tor distinto
     (= IP de salida diferente). NO requiere ControlPort (9051).
  2. Multi-location: 32 estados en 1 petición → minimiza peticiones.
  3. Reintento con rotación de IP ante HTTP 429 (Too Many Requests).
"""

import random
import socket
import string
import subprocess
import time
import logging
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests as req

from ..config import settings

logger = logging.getLogger("climavis.openmeteo")

# ── Pool de User-Agents ──────────────────────────────────────────────
_USER_AGENTS = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Safari/605.1.15",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
    "ClimaVis-DataSync/1.0 (research; climate-dashboard)",
]

# ── Variables diarias que se solicitan al archivo histórico ──────────
DAILY_VARIABLES = [
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_2m_mean",
    "precipitation_sum",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
    "wind_direction_10m_dominant",
    "shortwave_radiation_sum",
    "et0_fao_evapotranspiration",
]

# Las variables de humedad solo están en la API de forecast (reciente)
FORECAST_DAILY_VARIABLES = DAILY_VARIABLES + [
    "relative_humidity_2m_max",
    "relative_humidity_2m_min",
    "relative_humidity_2m_mean",
]


# ── Tor helpers ──────────────────────────────────────────────────────

def _random_creds() -> Tuple[str, str]:
    """Credenciales aleatorias para IsolateSOCKSAuth de Tor."""
    chars = string.ascii_lowercase + string.digits
    user = "".join(random.choices(chars, k=12))
    passwd = "".join(random.choices(chars, k=12))
    return user, passwd


def _tor_proxy(user: str, passwd: str) -> Dict[str, str]:
    """Devuelve dict de proxies para requests usando Tor SOCKS5."""
    url = f"socks5h://{user}:{passwd}@127.0.0.1:{settings.tor_socks_port}"
    return {"http": url, "https": url}


def _check_tor_available() -> bool:
    """Verifica si el proxy SOCKS5 de Tor es alcanzable."""
    try:
        sock = socket.create_connection(
            ("127.0.0.1", settings.tor_socks_port), timeout=3
        )
        sock.close()
        return True
    except (socket.error, OSError):
        return False


def ensure_tor_running() -> bool:
    """Inicia Tor si no está corriendo. Devuelve True cuando está listo."""
    if _check_tor_available():
        logger.info(
            "✓ Tor SOCKS5 ya disponible en puerto %d", settings.tor_socks_port
        )
        return True

    logger.info("Iniciando servicio Tor…")
    try:
        subprocess.Popen(
            ["tor"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except FileNotFoundError:
        logger.error("Tor no está instalado — sincronización sin rotación de IP")
        return False

    for _ in range(30):
        time.sleep(1)
        if _check_tor_available():
            logger.info("✓ Tor iniciado correctamente")
            return True

    logger.error("Tor no respondió en 30 s")
    return False


# ── Cliente principal ────────────────────────────────────────────────

class OpenMeteoClient:
    """
    Cliente con rotación de IP vía Tor y soporte multi-location.
    Cada par de credenciales random obtiene un circuito Tor diferente
    (IsolateSOCKSAuth), así cada petición que rota credenciales usa
    una IP de salida distinta.
    """

    def __init__(self):
        self._tor_available = _check_tor_available()
        self._request_count = 0
        self._cred_user: str = ""
        self._cred_pass: str = ""
        self._rotate_credentials()

    # ── Rotación de IP ──────────────────────────────────────────────

    def _rotate_credentials(self):
        """Nuevas credenciales Tor → nuevo circuito → nueva IP."""
        self._cred_user, self._cred_pass = _random_creds()
        self._request_count = 0
        if self._tor_available:
            logger.debug("Nuevas credenciales Tor (nueva IP de salida)")

    def _make_session(self) -> req.Session:
        session = req.Session()
        session.headers.update({
            "User-Agent": random.choice(_USER_AGENTS),
            "Accept": "application/json",
            "Accept-Language": random.choice(["es-MX", "en-US", "es"]),
        })
        if self._tor_available:
            session.proxies = _tor_proxy(self._cred_user, self._cred_pass)
        return session

    # ── GET con reintentos y rotación de IP ─────────────────────────

    def _get(self, url: str, params: dict) -> Any:
        last_exc: Optional[Exception] = None

        for attempt in range(1, settings.max_retries + 1):
            self._request_count += 1
            if self._request_count > settings.tor_rotate_every:
                self._rotate_credentials()

            session = self._make_session()
            try:
                resp = session.get(url, params=params, timeout=60)

                if resp.status_code == 429:
                    logger.warning("429 Rate-limited → rotando IP de Tor")
                    self._rotate_credentials()
                    time.sleep(2 * attempt)
                    continue

                resp.raise_for_status()
                return resp.json()

            except req.RequestException as exc:
                last_exc = exc
                logger.warning(
                    "Intento %d/%d falló: %s", attempt, settings.max_retries, exc
                )
                self._rotate_credentials()
                time.sleep(2 ** attempt)
            finally:
                session.close()

        raise RuntimeError(
            f"Fallo tras {settings.max_retries} intentos: {last_exc}"
        )

    def close(self):
        """No hay conexión persistente que cerrar."""

    # ── Multi-location: todos los estados en 1 petición ─────────────

    def fetch_archive_multi(
        self,
        locations: List[Tuple[str, float, float]],
        start_date: date,
        end_date: date,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Datos históricos para múltiples ubicaciones en 1 request.
        locations: [(state_name, lat, lon), …]
        Devuelve {state: [rows…]}.
        """
        params = {
            "latitude": ",".join(str(lat) for _, lat, _ in locations),
            "longitude": ",".join(str(lon) for _, _, lon in locations),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": ",".join(DAILY_VARIABLES),
            "timezone": "America/Mexico_City",
        }
        data = self._get(settings.openmeteo_archive_url, params)
        return self._parse_multi(data, locations)

    def fetch_recent_multi(
        self,
        locations: List[Tuple[str, float, float]],
        past_days: int = 7,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Datos recientes (incluye humedad) para múltiples ubicaciones."""
        params = {
            "latitude": ",".join(str(lat) for _, lat, _ in locations),
            "longitude": ",".join(str(lon) for _, _, lon in locations),
            "past_days": past_days,
            "forecast_days": 1,
            "daily": ",".join(FORECAST_DAILY_VARIABLES),
            "timezone": "America/Mexico_City",
        }
        data = self._get(settings.openmeteo_forecast_url, params)
        return self._parse_multi(data, locations)

    # ── Single-location (compatibilidad) ────────────────────────────

    def fetch_archive(
        self,
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
    ) -> List[Dict[str, Any]]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": ",".join(DAILY_VARIABLES),
            "timezone": "America/Mexico_City",
        }
        return self._parse_daily(self._get(settings.openmeteo_archive_url, params))

    def fetch_recent(
        self,
        latitude: float,
        longitude: float,
        past_days: int = 7,
    ) -> List[Dict[str, Any]]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "past_days": past_days,
            "forecast_days": 1,
            "daily": ",".join(FORECAST_DAILY_VARIABLES),
            "timezone": "America/Mexico_City",
        }
        return self._parse_daily(self._get(settings.openmeteo_forecast_url, params))

    # ── Parsers ─────────────────────────────────────────────────────

    @staticmethod
    def _parse_daily(raw: dict) -> List[Dict[str, Any]]:
        """Convierte respuesta daily → lista de dicts."""
        daily = raw.get("daily", {})
        times = daily.get("time", [])
        if not times:
            return []
        rows: List[Dict[str, Any]] = []
        for i, dt_str in enumerate(times):
            row: Dict[str, Any] = {"date": dt_str}
            for key in daily:
                if key == "time":
                    continue
                vals = daily[key]
                row[key] = vals[i] if i < len(vals) else None
            rows.append(row)
        return rows

    @staticmethod
    def _parse_multi(
        data: Any,
        locations: List[Tuple[str, float, float]],
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Parsea respuesta multi-location → {state: [rows…]}.
        Open-Meteo devuelve un array cuando hay >1 ubicación.
        """
        result: Dict[str, List[Dict[str, Any]]] = {}

        if isinstance(data, list):
            for idx, loc_data in enumerate(data):
                if idx >= len(locations):
                    break
                state = locations[idx][0]
                daily = loc_data.get("daily", {})
                times = daily.get("time", [])
                rows: List[Dict[str, Any]] = []
                for j, dt_str in enumerate(times):
                    row: Dict[str, Any] = {"date": dt_str}
                    for key in daily:
                        if key == "time":
                            continue
                        row[key] = daily[key][j] if j < len(daily[key]) else None
                    rows.append(row)
                result[state] = rows
        elif len(locations) == 1:
            result[locations[0][0]] = OpenMeteoClient._parse_daily(data)
        else:
            logger.warning("Respuesta inesperada (no es lista) para multi-location")
            for loc in locations:
                result[loc[0]] = []

        return result


# ── Helper legacy (compatibilidad con data_sync) ────────────────────

def fetch_state_data(
    client: OpenMeteoClient,
    state: str,
    latitude: float,
    longitude: float,
    start_date: date,
    end_date: date,
) -> List[Dict[str, Any]]:
    """
    Obtiene datos para un estado, dividiendo en chunks anuales.
    Compatible con la interfaz anterior.
    """
    all_rows: List[Dict[str, Any]] = []
    chunk_start = start_date

    while chunk_start <= end_date:
        chunk_end = min(chunk_start + timedelta(days=364), end_date)

        days_ago = (date.today() - chunk_end).days
        if days_ago < 5:
            past_d = min((date.today() - chunk_start).days + 1, 92)
            rows = client.fetch_recent(latitude, longitude, past_days=past_d)
        else:
            rows = client.fetch_archive(latitude, longitude, chunk_start, chunk_end)

        logger.info(
            "  %s: %s → %s  (%d registros)",
            state, chunk_start, chunk_end, len(rows),
        )
        all_rows.extend(rows)
        chunk_start = chunk_end + timedelta(days=1)

    return all_rows
