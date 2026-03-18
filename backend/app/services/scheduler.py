"""
Scheduler para ejecución diaria de sincronización de datos climáticos.
Usa APScheduler con un BackgroundScheduler que vive dentro del proceso FastAPI.
"""

import logging
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from ..config import settings
from .data_sync import sync_all_states

logger = logging.getLogger("climavis.scheduler")

_scheduler: Optional[BackgroundScheduler] = None


def start_scheduler():
    """Inicia el scheduler con el job diario."""
    global _scheduler

    if _scheduler and _scheduler.running:
        logger.warning("Scheduler ya está corriendo.")
        return

    _scheduler = BackgroundScheduler(timezone="America/Mexico_City")

    # Job diario: sincronizar todos los estados
    _scheduler.add_job(
        sync_all_states,
        trigger=CronTrigger(hour=settings.daily_sync_hour, minute=0),
        id="daily_sync",
        name="Sincronización diaria de datos climáticos",
        replace_existing=True,
        misfire_grace_time=3600,  # 1 hora de gracia
    )

    _scheduler.start()
    logger.info(
        "Scheduler iniciado – sync diario a las %02d:00",
        settings.daily_sync_hour,
    )


def stop_scheduler():
    """Detiene el scheduler de forma limpia."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler detenido.")
    _scheduler = None


def get_scheduler_info() -> dict:
    """Información del estado del scheduler."""
    if not _scheduler:
        return {"running": False, "jobs": []}

    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": str(job.next_run_time) if job.next_run_time else None,
        })

    return {"running": _scheduler.running, "jobs": jobs}
