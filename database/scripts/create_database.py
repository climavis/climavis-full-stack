"""
Script para crear la base de datos SQLite y las tablas iniciales
"""

import sqlite3
import os

# Ruta de la base de datos
DB_PATH = os.path.join(os.path.dirname(__file__), "../clima_historico.sqlite")


def crear_base_datos():
    """Crea la base de datos y las tablas necesarias"""
    
    # Conectar a la base de datos (se crea si no existe)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Crear tabla de datos climáticos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS datos_climaticos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estado TEXT NOT NULL,
            fecha DATE NOT NULL,
            temperatura_max REAL,
            temperatura_min REAL,
            temperatura_promedio REAL,
            precipitacion REAL,
            humedad REAL,
            UNIQUE(estado, fecha)
        )
    """)
    
    # Crear índices para mejorar consultas
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_estado ON datos_climaticos(estado)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_fecha ON datos_climaticos(fecha)
    """)
    
    # Crear tabla de predicciones
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predicciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estado TEXT NOT NULL,
            anio INTEGER NOT NULL,
            mes INTEGER NOT NULL,
            temperatura_predicha REAL,
            precipitacion_predicha REAL,
            confianza REAL,
            UNIQUE(estado, anio, mes)
        )
    """)
    
    # Crear índices para predicciones
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_prediccion_estado ON predicciones(estado)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_prediccion_anio ON predicciones(anio)
    """)
    
    conn.commit()
    conn.close()
    
    print(f"✅ Base de datos creada exitosamente en: {DB_PATH}")
    print("✅ Tablas creadas: datos_climaticos, predicciones")


if __name__ == "__main__":
    crear_base_datos()
