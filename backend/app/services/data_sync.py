"""
Servicio de sincronización de datos climáticos con Tor.

Lógica:
  1. Al iniciar, revisa la última fecha registrada por estado.
  2. Calcula la fecha de inicio global (la más antigua necesaria).
  3. Descarga datos de TODOS los estados en 1 petición multi-location
     por chunk anual, usando Tor para rotar IPs.
  4. UPSERT masivo → registros duplicados se actualizan sin conflicto.
  5. Todo se ejecuta en un hilo background para no bloquear la API.
"""

import logging
import random
import threading
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from ..config import settings
from ..database import SessionLocal
from ..models.clima import ClimateRecord, SyncStatus
from ..utils.coordinates import STATE_COORDINATES, ALL_STATES
from .openmeteo import OpenMeteoClient, ensure_tor_running, fetch_state_data

logger = logging.getLogger("climavis.sync")

# ── Estado global del sync ───────────────────────────────────────────
_sync_lock = threading.Lock()
_sync_running = False
_sync_progress: dict = {"status": "idle", "detail": "", "progress": 0}


def get_sync_progress() -> dict:
    return dict(_sync_progress)


def _update_progress(status: str, detail: str = "", progress: float = 0):
    global _sync_progress
    _sync_progress = {"status": status, "detail": detail, "progress": progress}


# ── Mapeo de campos OpenMeteo → columnas de BD ──────────────────────
def _map_row(state: str, row: dict) -> dict:
    """Convierte un row de OpenMeteo al formato de ClimateRecord."""
    return {
        "state": state,
        "date": row["date"],
        "temp_max": row.get("temperature_2m_max"),
        "temp_min": row.get("temperature_2m_min"),
        "temp_mean": row.get("temperature_2m_mean"),
        "precipitation": row.get("precipitation_sum"),
        "wind_max": row.get("wind_speed_10m_max"),
        "wind_gusts": row.get("wind_gusts_10m_max"),
        "wind_direction": row.get("wind_direction_10m_dominant"),
        "humidity_max": row.get("relative_humidity_2m_max"),
        "humidity_min": row.get("relative_humidity_2m_min"),
        "humidity_mean": row.get("relative_humidity_2m_mean"),
        "radiation": row.get("shortwave_radiation_sum"),
    }


def _bulk_upsert(db: Session, records: list[dict]):
    """
    Inserción masiva con UPSERT (ON CONFLICT DO UPDATE).
    Usa la sintaxis nativa de PostgreSQL para máxima eficiencia.
    """
    if not records:
        return

    stmt = pg_insert(ClimateRecord).values(records)
    stmt = stmt.on_conflict_do_update(
        constraint="uq_state_date",
        set_={
            "temp_max": stmt.excluded.temp_max,
            "temp_min": stmt.excluded.temp_min,
            "temp_mean": stmt.excluded.temp_mean,
            "precipitation": stmt.excluded.precipitation,
            "wind_max": stmt.excluded.wind_max,
            "wind_gusts": stmt.excluded.wind_gusts,
            "wind_direction": stmt.excluded.wind_direction,
            "humidity_max": stmt.excluded.humidity_max,
            "humidity_min": stmt.excluded.humidity_min,
            "humidity_mean": stmt.excluded.humidity_mean,
            "radiation": stmt.excluded.radiation,
            "updated_at": func.now(),
        },
    )
    db.execute(stmt)
    db.commit()


def _get_last_date(db: Session, state: str) -> Optional[date]:
    """Última fecha registrada para un estado."""
    result = (
        db.query(func.max(ClimateRecord.date))
        .filter(ClimateRecord.state == state)
        .scalar()
    )
    return result


def _get_all_last_dates(db: Session) -> Dict[str, Optional[date]]:
    """Última fecha registrada para CADA estado en una sola query."""
    rows = (
        db.query(ClimateRecord.state, func.max(ClimateRecord.date))
        .group_by(ClimateRecord.state)
        .all()
    )
    return {state: last_dt for state, last_dt in rows}


def _update_sync_status(
    db: Session,
    state: str,
    last_date: Optional[date],
    count: int,
    status: str = "ok",
    error: str = "",
):
    """Actualiza la tabla sync_status."""
    stmt = pg_insert(SyncStatus).values(
        state=state,
        last_synced_date=last_date,
        last_sync_at=func.now(),
        records_count=count,
        status=status,
        error_message=error[:500] if error else "",
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["state"],
        set_={
            "last_synced_date": stmt.excluded.last_synced_date,
            "last_sync_at": func.now(),
            "records_count": stmt.excluded.records_count,
            "status": stmt.excluded.status,
            "error_message": stmt.excluded.error_message,
        },
    )
    db.execute(stmt)
    db.commit()


# ── Sincronización por estado individual (compatibilidad) ───────────

def sync_state(
    client: OpenMeteoClient,
    db: Session,
    state: str,
    force_from: Optional[date] = None,
):
    """Sincroniza un solo estado."""
    coords = STATE_COORDINATES.get(state)
    if not coords:
        logger.warning("Estado desconocido: %s", state)
        return

    lat, lon = coords
    today = date.today() - timedelta(days=1)  # ayer (datos más recientes confiables)

    if force_from:
        start = force_from
    else:
        last = _get_last_date(db, state)
        if last is None:
            start = date.fromisoformat(settings.history_start_date)
            logger.info("  %s: sin datos → carga completa desde %s", state, start)
        else:
            gap = (today - last).days
            if gap <= 0:
                logger.info("  %s: al día (último: %s)", state, last)
                _update_sync_status(db, state, last, 0)
                return
            start = last + timedelta(days=1)
            mode = "BULK" if gap > settings.bulk_threshold_days else "incremental"
            logger.info("  %s: %d días faltantes → modo %s", state, gap, mode)

    if start > today:
        return

    try:
        _update_sync_status(db, state, None, 0, status="syncing")
        rows = fetch_state_data(client, state, lat, lon, start, today)

        if rows:
            records = [_map_row(state, r) for r in rows]
            # Insertar en lotes de 500
            batch_size = 500
            for i in range(0, len(records), batch_size):
                _bulk_upsert(db, records[i : i + batch_size])

        new_last = _get_last_date(db, state)
        _update_sync_status(db, state, new_last, len(rows))
        logger.info("  %s: ✓ %d registros insertados/actualizados", state, len(rows))

    except Exception as exc:
        logger.error("  %s: ERROR – %s", state, exc)
        _update_sync_status(db, state, None, 0, status="error", error=str(exc))
        raise


# ── Sincronización multi-location (optimizada con Tor) ──────────────

def _build_locations() -> List[Tuple[str, float, float]]:
    """Lista de (estado, lat, lon) para todos los estados."""
    return [
        (state, coords[0], coords[1])
        for state, coords in STATE_COORDINATES.items()
    ]


def sync_all_states_multi(force_from: Optional[date] = None):
    """
    Sincronización optimizada: 32 estados en 1 petición por chunk.
    Usa Tor para rotar IPs y evitar rate-limiting.
    """
    db = SessionLocal()
    client = OpenMeteoClient()
    locations = _build_locations()

    try:
        # ── 1. Determinar rango de fechas ────────────────────────────
        today = date.today() - timedelta(days=1)

        if force_from:
            global_start = force_from
        else:
            last_dates = _get_all_last_dates(db)
            starts: List[date] = []
            up_to_date_count = 0

            for state, _, _ in locations:
                last = last_dates.get(state)
                if last is None:
                    starts.append(date.fromisoformat(settings.history_start_date))
                else:
                    gap = (today - last).days
                    if gap <= 0:
                        up_to_date_count += 1
                        continue
                    starts.append(last + timedelta(days=1))

            if not starts:
                logger.info(
                    "═══ Todos los %d estados están al día ═══", up_to_date_count
                )
                _update_progress("completed", "Todo al día", 100)
                return

            global_start = min(starts)
            logger.info(
                "Fecha inicio global: %s  (estados al día: %d, pendientes: %d)",
                global_start, up_to_date_count, len(starts),
            )

        if global_start > today:
            _update_progress("completed", "Todo al día", 100)
            return

        # ── 2. Descargar en chunks anuales ───────────────────────────
        chunk_start = global_start
        total_days = (today - global_start).days + 1
        total_records = 0
        chunk_num = 0

        while chunk_start <= today:
            chunk_end = min(chunk_start + timedelta(days=364), today)
            days_done = (chunk_start - global_start).days
            progress = round(days_done / total_days * 100, 1) if total_days > 0 else 0
            chunk_num += 1

            _update_progress(
                "running",
                f"Descargando {chunk_start} → {chunk_end}  "
                f"(32 estados × {(chunk_end - chunk_start).days + 1} días)",
                progress,
            )

            try:
                days_ago = (date.today() - chunk_end).days

                if days_ago < 5:
                    # Datos recientes → forecast API (incluye humedad)
                    past_d = min((date.today() - chunk_start).days + 1, 92)
                    multi_data = client.fetch_recent_multi(
                        locations, past_days=past_d
                    )
                else:
                    multi_data = client.fetch_archive_multi(
                        locations, chunk_start, chunk_end
                    )

                # ── 3. UPSERT por estado ─────────────────────────────
                for state, rows in multi_data.items():
                    if not rows:
                        continue
                    records = [_map_row(state, r) for r in rows]
                    batch_size = 500
                    for i in range(0, len(records), batch_size):
                        _bulk_upsert(db, records[i : i + batch_size])
                    total_records += len(records)

                logger.info(
                    "  Chunk %d: %s → %s  ✓  (%d estados, %d registros)",
                    chunk_num,
                    chunk_start,
                    chunk_end,
                    len(multi_data),
                    sum(len(r) for r in multi_data.values()),
                )

            except Exception as exc:
                logger.error(
                    "  Chunk %s → %s FALLÓ: %s", chunk_start, chunk_end, exc
                )
                # Continuar con el siguiente chunk
                pass

            chunk_start = chunk_end + timedelta(days=1)

        # ── 4. Actualizar sync_status por estado ─────────────────────
        for state, _, _ in locations:
            new_last = _get_last_date(db, state)
            count = (
                db.query(func.count(ClimateRecord.id))
                .filter(ClimateRecord.state == state)
                .scalar()
            ) or 0
            _update_sync_status(db, state, new_last, count)

        _update_progress("completed", f"✓ {total_records} registros totales", 100)
        logger.info(
            "═══ Sincronización completa: %d registros insertados/actualizados ═══",
            total_records,
        )

    except Exception as exc:
        _update_progress("error", str(exc), 0)
        logger.error("Error fatal en sincronización: %s", exc)

    finally:
        client.close()
        db.close()


# ── Funciones legacy (compatibilidad) ────────────────────────────────

def sync_all_states(force_from: Optional[date] = None):
    """
    Sincroniza TODOS los estados.
    Usa la nueva estrategia multi-location con Tor.
    """
    global _sync_running

    if _sync_running:
        logger.warning("Sincronización ya en curso, ignorando petición.")
        return

    with _sync_lock:
        _sync_running = True

    try:
        _update_progress("running", "Iniciando sincronización con Tor…", 0)

        # Intentar iniciar Tor
        tor_ok = ensure_tor_running()
        if tor_ok:
            logger.info("Usando Tor para rotación de IP")
        else:
            logger.warning("Tor no disponible — sincronización sin rotación de IP")

        sync_all_states_multi(force_from)

    except Exception as exc:
        _update_progress("error", str(exc), 0)
        logger.error("Error fatal en sincronización: %s", exc)

    finally:
        with _sync_lock:
            _sync_running = False


def start_background_sync(force_from: Optional[date] = None):
    """Lanza la sincronización en un hilo daemon."""
    t = threading.Thread(
        target=sync_all_states,
        kwargs={"force_from": force_from},
        daemon=True,
        name="climavis-sync",
    )
    t.start()
    return t
