"""
API Principal para ClimaVis – Climate Dashboard
Framework: FastAPI
Base de datos: PostgreSQL (SQLAlchemy)
Datos: Open-Meteo (sync automático)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

from .config import settings
from .database import init_db
from .routes.clima import router as clima_router
from .services.scheduler import start_scheduler, stop_scheduler
from .services.data_sync import start_background_sync
from .services.openmeteo import ensure_tor_running

# ── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-24s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("climavis")


# ── Lifecycle ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ejecuta al inicio y al cierre de la aplicación."""
    # Startup
    logger.info("═══ ClimaVis Backend iniciando ═══")
    init_db()
    logger.info("Base de datos PostgreSQL inicializada")

    # Scheduler diario
    start_scheduler()

    # Sync al arranque si está configurado
    if settings.sync_on_startup:
        # Iniciar Tor antes de la sincronización
        tor_ok = ensure_tor_running()
        if tor_ok:
            logger.info("Tor disponible — sincronización con rotación de IP")
        else:
            logger.warning("Tor no disponible — sync sin rotación de IP")
        logger.info("Iniciando sincronización de datos en background…")
        start_background_sync()

    yield

    # Shutdown
    stop_scheduler()
    logger.info("═══ ClimaVis Backend detenido ═══")


# ── App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ClimaVis API",
    description="API de datos climáticos de México — PostgreSQL + Open-Meteo",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(clima_router)


# ── Root ───────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "message": "ClimaVis API – Dashboard de Cambio Climático",
        "version": "2.0.0",
        "database": "PostgreSQL",
        "data_source": "Open-Meteo",
        "endpoints": {
            "estados": "/api/estados",
            "clima": "/api/clima",
            "stats": "/api/clima/stats",
            "monthly": "/api/clima/monthly",
            "map_summary": "/api/clima/map-summary",
            "annual_range": "/api/clima/annual-range",
            "sync_status": "/api/sync/status",
            "sync_trigger": "/api/sync/trigger",
            "health": "/health",
        },
    }


# ── Eventos climáticos (markdown) ─────────────────────────────────────
@app.get("/eventos-climaticos")
def get_eventos_climaticos():
    eventos_path = os.path.join(
        os.path.dirname(__file__), "../info/eventos_climaticos.md"
    )
    if not os.path.exists(eventos_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Archivo de eventos no encontrado")

    return FileResponse(
        eventos_path,
        media_type="text/markdown",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
