"""
Configuración centralizada de ClimaVis
Lee variables de entorno con valores por defecto sensatos.
"""

import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    # ── Base de datos ──────────────────────────────────────────
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "postgresql://climavis:climavis_secret@localhost:5432/climavis",
        )
    )

    # ── OpenMeteo ──────────────────────────────────────────────
    openmeteo_archive_url: str = "https://archive-api.open-meteo.com/v1/archive"
    openmeteo_forecast_url: str = "https://api.open-meteo.com/v1/forecast"

    # ── Sincronización ─────────────────────────────────────────
    sync_on_startup: bool = field(
        default_factory=lambda: os.getenv("SYNC_ON_STARTUP", "true").lower() == "true"
    )
    daily_sync_hour: int = field(
        default_factory=lambda: int(os.getenv("DAILY_SYNC_HOUR", "6"))
    )
    bulk_threshold_days: int = field(
        default_factory=lambda: int(os.getenv("BULK_THRESHOLD_DAYS", "50"))
    )
    history_start_date: str = field(
        default_factory=lambda: os.getenv("HISTORY_START_DATE", "2020-01-01")
    )

    # ── Throttling / rotación de peticiones ────────────────────
    request_delay_min: float = field(
        default_factory=lambda: float(os.getenv("REQUEST_DELAY_MIN", "1.0"))
    )
    request_delay_max: float = field(
        default_factory=lambda: float(os.getenv("REQUEST_DELAY_MAX", "3.0"))
    )
    max_retries: int = 5
    retry_backoff_base: float = 2.0
    rate_limit_cooldown: float = 60.0  # segundos de espera ante 429

    # ── Tor (rotación de IP) ───────────────────────────────────
    tor_socks_port: int = field(
        default_factory=lambda: int(os.getenv("TOR_SOCKS_PORT", "9050"))
    )
    tor_rotate_every: int = field(
        default_factory=lambda: int(os.getenv("TOR_ROTATE_EVERY", "2"))
    )


settings = Settings()
