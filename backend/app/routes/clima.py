"""
Rutas de datos climáticos – optimizadas con consultas PostgreSQL nativas.

Endpoints:
  GET /api/estados          – lista de estados
  GET /api/clima            – datos diarios con filtros
  GET /api/clima/stats      – estadísticas agregadas
  GET /api/clima/monthly    – resumen mensual para un año completo (1 sola llamada)
  GET /api/clima/map-summary – resumen actual de todos los estados (para el mapa)
  GET /api/sync/status      – estado de sincronización
  POST /api/sync/trigger    – dispara sync manual
"""

from datetime import date, timedelta, datetime
import csv
import io
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, extract, text, case, and_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.clima import ClimateRecord, SyncStatus
from ..utils.coordinates import ALL_STATES, resolve_state, to_frontend_key
from ..services.data_sync import get_sync_progress, start_background_sync

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════
#  ESTADOS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/estados")
def get_estados(db: Session = Depends(get_db)):
    """Lista todos los estados que tienen datos (en formato frontend)."""
    states = (
        db.query(ClimateRecord.state)
        .distinct()
        .order_by(ClimateRecord.state)
        .all()
    )
    # Convertir nombres BD → formato frontend (UPPER, sin acentos)
    state_list = [to_frontend_key(s[0]) for s in states]

    # Si la BD está vacía, devolver la lista completa en formato frontend
    if not state_list:
        state_list = sorted(to_frontend_key(s) for s in ALL_STATES)

    return {"success": True, "data": state_list, "count": len(state_list)}


# ═══════════════════════════════════════════════════════════════════════
#  DATOS CLIMÁTICOS DIARIOS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/clima")
def get_clima(
    estado: str = Query(..., description="Nombre del estado"),
    fecha: Optional[str] = Query(None, description="Fecha YYYY-MM-DD"),
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
    limit: int = Query(365, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """Datos climáticos diarios con filtros opcionales."""
    estado = resolve_state(estado)
    q = db.query(ClimateRecord).filter(ClimateRecord.state == estado)

    if fecha:
        q = q.filter(ClimateRecord.date == fecha)
    else:
        if anio:
            q = q.filter(extract("year", ClimateRecord.date) == anio)
        if mes:
            q = q.filter(extract("month", ClimateRecord.date) == mes)

    rows = q.order_by(ClimateRecord.date.desc()).limit(limit).all()

    data = [
        {
            "fecha": row.date.isoformat(),
            "estado": row.state,
            "temperatura": {
                "maxima": row.temp_max,
                "minima": row.temp_min,
                "media": row.temp_mean,
            },
            "precipitacion": row.precipitation or 0,
            "viento": {
                "maximo": row.wind_max,
                "medio": row.wind_gusts,  # aprox. usando ráfaga
            },
            "humedad": {
                "maxima": row.humidity_max,
                "minima": row.humidity_min,
                "media": row.humidity_mean,
            },
        }
        for row in rows
    ]

    return {
        "success": True,
        "data": data,
        "count": len(data),
    }


# ═══════════════════════════════════════════════════════════════════════
#  ESTADÍSTICAS AGREGADAS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/clima/stats")
def get_clima_stats(
    estado: str = Query(...),
    anio: Optional[int] = Query(None),
    mes: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """Estadísticas climáticas agregadas para un estado."""
    estado = resolve_state(estado)
    q = db.query(
        func.count(ClimateRecord.id).label("total"),
        func.avg(ClimateRecord.temp_mean).label("temp_avg"),
        func.max(ClimateRecord.temp_max).label("temp_max"),
        func.min(ClimateRecord.temp_min).label("temp_min"),
        func.avg(ClimateRecord.precipitation).label("precip_avg"),
        func.sum(ClimateRecord.precipitation).label("precip_total"),
        func.avg(ClimateRecord.humidity_mean).label("humidity_avg"),
        func.avg(ClimateRecord.wind_max).label("wind_avg"),
    ).filter(ClimateRecord.state == estado)

    if anio:
        q = q.filter(extract("year", ClimateRecord.date) == anio)
    if mes:
        q = q.filter(extract("month", ClimateRecord.date) == mes)

    row = q.one()

    def _r(v, d=2):
        return round(v, d) if v is not None else None

    stats = {
        "estado": estado,
        "anio": anio,
        "mes": mes,
        "total_registros": row.total or 0,
        "temperatura": {
            "promedio": _r(row.temp_avg),
            "maxima": _r(row.temp_max),
            "minima": _r(row.temp_min),
        },
        "precipitacion": {
            "promedio": _r(row.precip_avg),
            "total": _r(row.precip_total),
        },
        "humedad_promedio": _r(row.humidity_avg),
        "viento_promedio": _r(row.wind_avg),
    }

    return {"success": True, "data": stats}


# ═══════════════════════════════════════════════════════════════════════
#  RESUMEN MENSUAL (año completo en UNA sola llamada)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/clima/monthly")
def get_yearly_monthly(
    estado: str = Query(...),
    anio: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Devuelve 12 objetos (uno por mes) con estadísticas agregadas.
    Reemplaza las 12 llamadas individuales del frontend.
    """
    estado = resolve_state(estado)
    month_names = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ]

    rows = (
        db.query(
            extract("month", ClimateRecord.date).label("mes"),
            func.avg(ClimateRecord.temp_mean).label("temp_avg"),
            func.avg(ClimateRecord.precipitation).label("precip_avg"),
            func.avg(ClimateRecord.humidity_mean).label("humidity_avg"),
            func.avg(ClimateRecord.wind_max).label("wind_avg"),
            func.count(ClimateRecord.id).label("registros"),
        )
        .filter(
            ClimateRecord.state == estado,
            extract("year", ClimateRecord.date) == anio,
        )
        .group_by(extract("month", ClimateRecord.date))
        .order_by(extract("month", ClimateRecord.date))
        .all()
    )

    # Indexar resultados por mes
    by_month = {int(r.mes): r for r in rows}

    data = []
    for m in range(1, 13):
        r = by_month.get(m)
        data.append({
            "month": month_names[m - 1],
            "monthNumber": m,
            "temperatura": round(r.temp_avg, 1) if r and r.temp_avg else 0,
            "precipitacion": round(r.precip_avg, 1) if r and r.precip_avg else 0,
            "humedad": round(r.humidity_avg, 1) if r and r.humidity_avg else 0,
            "viento": round(r.wind_avg, 1) if r and r.wind_avg else 0,
            "registros": r.registros if r else 0,
        })

    return {"success": True, "data": data}


# ═══════════════════════════════════════════════════════════════════════
#  RESUMEN PARA EL MAPA (todos los estados, UNA llamada)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/clima/map-summary")
def get_map_summary(
    anio: Optional[int] = Query(None),
    mes: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """
    Devuelve métricas clave de TODOS los estados en una sola consulta.
    Ideal para colorear el mapa sin hacer 32 llamadas individuales.
    """
    q = db.query(
        ClimateRecord.state,
        func.avg(ClimateRecord.temp_mean).label("temp_avg"),
        func.sum(ClimateRecord.precipitation).label("precip_total"),
        func.avg(ClimateRecord.wind_max).label("wind_avg"),
        func.avg(ClimateRecord.humidity_mean).label("humidity_avg"),
        func.count(ClimateRecord.id).label("registros"),
    )

    if anio:
        q = q.filter(extract("year", ClimateRecord.date) == anio)
    if mes:
        q = q.filter(extract("month", ClimateRecord.date) == mes)

    rows = q.group_by(ClimateRecord.state).all()

    data = {}
    for r in rows:
        # Clave en formato frontend para que MapView lo encuentre
        key = to_frontend_key(r.state)
        data[key] = {
            "temperatura": round(r.temp_avg, 1) if r.temp_avg else None,
            "precipitacion": round(r.precip_total, 1) if r.precip_total else None,
            "viento": round(r.wind_avg, 1) if r.wind_avg else None,
            "humedad": round(r.humidity_avg, 1) if r.humidity_avg else None,
            "registros": r.registros,
        }

    return {"success": True, "data": data}


# ═══════════════════════════════════════════════════════════════════════
#  RANGO ANUAL (para gráficas multi-año)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/clima/annual-range")
def get_annual_range(
    estado: str = Query(...),
    start_year: int = Query(...),
    end_year: int = Query(...),
    db: Session = Depends(get_db),
):
    """Stats anuales para un rango de años (para gráficas de tendencia)."""
    estado = resolve_state(estado)
    rows = (
        db.query(
            extract("year", ClimateRecord.date).label("anio"),
            func.avg(ClimateRecord.temp_mean).label("temp_avg"),
            func.sum(ClimateRecord.precipitation).label("precip_total"),
            func.avg(ClimateRecord.precipitation).label("precip_avg"),
            func.count(ClimateRecord.id).label("registros"),
        )
        .filter(
            ClimateRecord.state == estado,
            extract("year", ClimateRecord.date) >= start_year,
            extract("year", ClimateRecord.date) <= end_year,
        )
        .group_by(extract("year", ClimateRecord.date))
        .order_by(extract("year", ClimateRecord.date))
        .all()
    )

    data = [
        {
            "year": int(r.anio),
            "temperatura": round(r.temp_avg, 1) if r.temp_avg else 0,
            "precipitacion": round(r.precip_avg, 1) if r.precip_avg else 0,
            "registros": r.registros,
        }
        for r in rows
    ]

    return {"success": True, "data": data}


# ═══════════════════════════════════════════════════════════════════════
#  EXPORTACIÓN DE DATASETS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/clima/export")
def export_clima_dataset(
    formato: str = Query("csv", pattern="^(csv|json|txt|xlsx)$"),
    estado: Optional[str] = Query(None, description="Estado en formato frontend o BD"),
    anio: Optional[int] = Query(None, description="Filtra por año exacto"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Filtra por un mes"),
    meses: Optional[str] = Query(None, description="Lista de meses separados por coma, p.ej. 3,4,5"),
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    resumen: bool = Query(False, description="Si true, exporta tabla de promedios"),
    agrupar_por: str = Query("none", pattern="^(none|state|year|month)$"),
    db: Session = Depends(get_db),
):
    """
    Exporta datasets climáticos en csv/json/txt/xlsx.

    Soporta filtros por estado, año, mes, meses (lista) y rango de fechas.
    Si resumen=true, genera tabla agregada con promedios/sumas.
    """
    # Parsear meses (si se proporciona)
    months_list = None
    if meses:
        try:
            months_list = [int(m.strip()) for m in meses.split(",") if m.strip()]
        except ValueError as exc:
            raise HTTPException(400, "meses debe contener enteros separados por coma") from exc
        if not months_list or any(m < 1 or m > 12 for m in months_list):
            raise HTTPException(400, "meses debe estar entre 1 y 12")

    # Parsear fechas (si se proporcionan)
    start_dt = None
    end_dt = None
    if fecha_inicio:
        try:
            start_dt = date.fromisoformat(fecha_inicio)
        except ValueError as exc:
            raise HTTPException(400, "fecha_inicio inválida, usa YYYY-MM-DD") from exc
    if fecha_fin:
        try:
            end_dt = date.fromisoformat(fecha_fin)
        except ValueError as exc:
            raise HTTPException(400, "fecha_fin inválida, usa YYYY-MM-DD") from exc

    if start_dt and end_dt and start_dt > end_dt:
        raise HTTPException(400, "fecha_inicio no puede ser mayor a fecha_fin")

    # Query base con filtros
    q = db.query(ClimateRecord)
    if estado:
        q = q.filter(ClimateRecord.state == resolve_state(estado))
    if anio:
        q = q.filter(extract("year", ClimateRecord.date) == anio)
    if mes:
        q = q.filter(extract("month", ClimateRecord.date) == mes)
    if months_list:
        q = q.filter(extract("month", ClimateRecord.date).in_(months_list))
    if start_dt:
        q = q.filter(ClimateRecord.date >= start_dt)
    if end_dt:
        q = q.filter(ClimateRecord.date <= end_dt)

    records = []
    if resumen:
        group_cols = []
        if agrupar_por == "state":
            group_cols.append(ClimateRecord.state.label("estado"))
        elif agrupar_por == "year":
            group_cols.append(extract("year", ClimateRecord.date).label("anio"))
        elif agrupar_por == "month":
            group_cols.append(extract("month", ClimateRecord.date).label("mes"))

        aggregates = [
            func.count(ClimateRecord.id).label("registros"),
            func.avg(ClimateRecord.temp_mean).label("temp_promedio"),
            func.max(ClimateRecord.temp_max).label("temp_maxima"),
            func.min(ClimateRecord.temp_min).label("temp_minima"),
            func.avg(ClimateRecord.precipitation).label("precip_promedio"),
            func.sum(ClimateRecord.precipitation).label("precip_total"),
            func.avg(ClimateRecord.humidity_mean).label("humedad_promedio"),
            func.avg(ClimateRecord.wind_max).label("viento_promedio"),
            func.avg(ClimateRecord.radiation).label("radiacion_promedio"),
        ]

        query = db.query(*(group_cols + aggregates))
        if estado:
            query = query.filter(ClimateRecord.state == resolve_state(estado))
        if anio:
            query = query.filter(extract("year", ClimateRecord.date) == anio)
        if mes:
            query = query.filter(extract("month", ClimateRecord.date) == mes)
        if months_list:
            query = query.filter(extract("month", ClimateRecord.date).in_(months_list))
        if start_dt:
            query = query.filter(ClimateRecord.date >= start_dt)
        if end_dt:
            query = query.filter(ClimateRecord.date <= end_dt)

        if group_cols:
            query = query.group_by(*group_cols)

        rows = query.order_by(*group_cols).all() if group_cols else query.all()
        for row in rows:
            payload = {}
            if agrupar_por == "state":
                payload["estado"] = row.estado
            elif agrupar_por == "year":
                payload["anio"] = int(row.anio)
            elif agrupar_por == "month":
                payload["mes"] = int(row.mes)

            payload.update({
                "registros": int(row.registros or 0),
                "temp_promedio": round(row.temp_promedio or 0, 2),
                "temp_maxima": round(row.temp_maxima or 0, 2),
                "temp_minima": round(row.temp_minima or 0, 2),
                "precip_promedio": round(row.precip_promedio or 0, 2),
                "precip_total": round(row.precip_total or 0, 2),
                "humedad_promedio": round(row.humedad_promedio or 0, 2),
                "viento_promedio": round(row.viento_promedio or 0, 2),
                "radiacion_promedio": round(row.radiacion_promedio or 0, 2),
            })
            records.append(payload)
    else:
        rows = q.order_by(ClimateRecord.date.asc(), ClimateRecord.state.asc()).all()
        for row in rows:
            records.append({
                "estado": row.state,
                "fecha": row.date.isoformat(),
                "temp_max": row.temp_max,
                "temp_min": row.temp_min,
                "temp_mean": row.temp_mean,
                "precipitation": row.precipitation,
                "wind_max": row.wind_max,
                "wind_gusts": row.wind_gusts,
                "wind_direction": row.wind_direction,
                "humidity_max": row.humidity_max,
                "humidity_min": row.humidity_min,
                "humidity_mean": row.humidity_mean,
                "radiation": row.radiation,
            })

    if not records:
        raise HTTPException(404, "No se encontraron datos con esos filtros")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    scope = "resumen" if resumen else "dataset"
    filename = f"clima_{scope}_{timestamp}.{formato}"

    if formato == "json":
        body = json.dumps(records, ensure_ascii=False, indent=2)
        media = "application/json"
        return Response(
            content=body,
            media_type=media,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    if formato in {"csv", "txt"}:
        output = io.StringIO()
        delimiter = "," if formato == "csv" else "\t"
        writer = csv.DictWriter(output, fieldnames=list(records[0].keys()), delimiter=delimiter)
        writer.writeheader()
        writer.writerows(records)
        media = "text/csv" if formato == "csv" else "text/plain"
        return Response(
            content=output.getvalue(),
            media_type=media,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # XLSX
    try:
        import pandas as pd  # type: ignore
    except Exception as exc:
        raise HTTPException(500, "No está disponible la dependencia para exportar xlsx") from exc

    buffer = io.BytesIO()
    df = pd.DataFrame(records)
    df.to_excel(buffer, index=False, sheet_name="clima")
    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ═══════════════════════════════════════════════════════════════════════
#  SINCRONIZACIÓN
# ═══════════════════════════════════════════════════════════════════════

@router.get("/api/sync/status")
def sync_status(db: Session = Depends(get_db)):
    """Estado actual de la sincronización."""
    progress = get_sync_progress()

    states = db.query(SyncStatus).order_by(SyncStatus.state).all()
    state_details = [
        {
            "state": s.state,
            "last_synced_date": s.last_synced_date.isoformat() if s.last_synced_date else None,
            "last_sync_at": s.last_sync_at.isoformat() if s.last_sync_at else None,
            "records_count": s.records_count,
            "status": s.status,
            "error": s.error_message,
        }
        for s in states
    ]

    return {
        "success": True,
        "data": {
            "progress": progress,
            "states": state_details,
        },
    }


@router.post("/api/sync/trigger")
def trigger_sync(
    from_date: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
):
    """Dispara sincronización manual en background."""
    force_from = None
    if from_date:
        try:
            force_from = date.fromisoformat(from_date)
        except ValueError:
            raise HTTPException(400, "Formato de fecha inválido. Use YYYY-MM-DD")

    current = get_sync_progress()
    if current["status"] == "running":
        return {
            "success": False,
            "message": "Sincronización ya en curso",
            "data": current,
        }

    start_background_sync(force_from)
    return {
        "success": True,
        "message": "Sincronización iniciada en background",
    }


# ═══════════════════════════════════════════════════════════════════════
#  HEALTH
# ═══════════════════════════════════════════════════════════════════════

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Verifica que la API y la BD estén funcionando."""
    try:
        db.execute(text("SELECT 1"))
        total = db.query(func.count(ClimateRecord.id)).scalar() or 0
        return {
            "status": "healthy",
            "database": "connected",
            "total_records": total,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }
