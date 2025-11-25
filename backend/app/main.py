"""
API Principal para Climate Dashboard
Framework: FastAPI
Base de datos: SQLite
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Optional
import sqlite3
from datetime import datetime
import os

app = FastAPI(
    title="Climate API",
    description="API para datos climáticos de México",
    version="1.0.0"
)

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173",
        "http://localhost:5174",
        "*"  # Permitir todas las conexiones en desarrollo
    ],  # URLs del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta de la base de datos
DB_PATH = os.path.join(os.path.dirname(__file__), "../../database/clima_historico.sqlite")


def get_db_connection():
    """Obtiene una conexión a la base de datos SQLite"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Para obtener resultados como diccionarios
    return conn


@app.get("/")
def read_root():
    """Endpoint raíz - información de la API"""
    return {
        "message": "Climate API - Dashboard de Cambio Climático",
        "version": "1.0.0",
        "endpoints": {
            "clima": "/api/clima",
            "estados": "/api/estados",
            "predicciones": "/api/predicciones"
        }
    }


@app.get("/api/estados")
def get_estados():
    """Obtiene la lista de todos los estados disponibles"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Obtener estados únicos de la tabla history
        cursor.execute("SELECT DISTINCT estado FROM history ORDER BY estado")
        estados = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "success": True,
            "data": estados,
            "count": len(estados)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/clima")
def get_clima(
    estado: str = Query(..., description="Nombre del estado"),
    fecha: Optional[str] = Query(None, description="Fecha en formato YYYY-MM-DD"),
    mes: Optional[int] = Query(None, description="Mes (1-12)"),
    anio: Optional[int] = Query(None, description="Año"),
    limit: int = Query(365, description="Límite de registros a retornar")
):
    """
    Obtiene datos climáticos para un estado específico
    Puede filtrar por fecha exacta, mes, o año
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Construir query dinámicamente según los parámetros
        query = "SELECT * FROM history WHERE estado = ?"
        params = [estado]
        
        if fecha:
            query += " AND fecha = ?"
            params.append(fecha)
        elif mes and anio:
            query += " AND strftime('%m', fecha) = ? AND strftime('%Y', fecha) = ?"
            params.extend([f"{mes:02d}", str(anio)])
        elif anio:
            query += " AND strftime('%Y', fecha) = ?"
            params.append(str(anio))
        
        query += " ORDER BY fecha DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convertir resultados a lista de diccionarios con nombres más amigables
        data = []
        for row in rows:
            data.append({
                "fecha": row["fecha"],
                "estado": row["estado"],
                "temperatura": {
                    "maxima": row["temp_max_c"],
                    "minima": row["temp_min_c"],
                    "media": row["temp_media_c"]
                },
                "precipitacion": row["precipitacion_mm"],
                "viento": {
                    "maximo": row["viento_max_kmh"],
                    "medio": row["viento_media_kmh"]
                },
                "humedad": {
                    "maxima": row["humedad_max_%"],
                    "minima": row["humedad_min_%"],
                    "media": row["humedad_media_%"]
                }
            })
        
        conn.close()
        
        if not data:
            return {
                "success": True,
                "message": "No se encontraron datos para los parámetros especificados",
                "data": [],
                "count": 0
            }
        
        return {
            "success": True,
            "data": data,
            "count": len(data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/clima/stats")
def get_clima_stats(
    estado: str = Query(..., description="Nombre del estado"),
    anio: Optional[int] = Query(None, description="Año para estadísticas"),
    mes: Optional[int] = Query(None, description="Mes para estadísticas (1-12)")
):
    """
    Obtiene estadísticas climáticas agregadas para un estado
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                COUNT(*) as total_registros,
                AVG(temp_media_c) as temp_promedio,
                MAX(temp_max_c) as temp_maxima,
                MIN(temp_min_c) as temp_minima,
                AVG(precipitacion_mm) as precipitacion_promedio,
                SUM(precipitacion_mm) as precipitacion_total,
                AVG("humedad_media_%") as humedad_promedio,
                AVG(viento_media_kmh) as viento_promedio
            FROM history 
            WHERE estado = ?
        """
        params = [estado]
        
        if anio:
            query += " AND strftime('%Y', fecha) = ?"
            params.append(str(anio))
        
        if mes:
            query += " AND strftime('%m', fecha) = ?"
            params.append(f"{mes:02d}")
        
        cursor.execute(query, params)
        row = cursor.fetchone()
        
        conn.close()
        
        stats = {
            "estado": estado,
            "anio": anio,
            "mes": mes,
            "total_registros": row["total_registros"],
            "temperatura": {
                "promedio": round(row["temp_promedio"], 2) if row["temp_promedio"] else None,
                "maxima": round(row["temp_maxima"], 2) if row["temp_maxima"] else None,
                "minima": round(row["temp_minima"], 2) if row["temp_minima"] else None
            },
            "precipitacion": {
                "promedio": round(row["precipitacion_promedio"], 2) if row["precipitacion_promedio"] else None,
                "total": round(row["precipitacion_total"], 2) if row["precipitacion_total"] else None
            },
            "humedad_promedio": round(row["humedad_promedio"], 2) if row["humedad_promedio"] else None,
            "viento_promedio": round(row["viento_promedio"], 2) if row["viento_promedio"] else None
        }
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/eventos-climaticos")
def get_eventos_climaticos():
    """
    Endpoint para obtener los eventos climáticos actuales
    Lee el archivo markdown con los eventos en curso
    """
    try:
        eventos_path = os.path.join(os.path.dirname(__file__), "../info/eventos_climaticos.md")
        
        if not os.path.exists(eventos_path):
            raise HTTPException(status_code=404, detail="Archivo de eventos no encontrado")
        
        return FileResponse(
            eventos_path,
            media_type="text/markdown",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
