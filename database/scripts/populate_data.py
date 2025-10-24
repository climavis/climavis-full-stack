"""
Script de ejemplo para poblar la base de datos con datos de prueba
"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

# Ruta de la base de datos
DB_PATH = os.path.join(os.path.dirname(__file__), "../clima_historico.sqlite")

# Estados de México
ESTADOS = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
    'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
    'Estado de México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
    'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
    'Veracruz', 'Yucatán', 'Zacatecas'
]


def generar_datos_prueba():
    """Genera datos climáticos de prueba para todos los estados"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    fecha_inicio = datetime(2020, 1, 1)
    fecha_fin = datetime(2025, 10, 13)
    
    print("Generando datos de prueba...")
    
    for estado in ESTADOS:
        print(f"  Procesando: {estado}...")
        
        fecha_actual = fecha_inicio
        while fecha_actual <= fecha_fin:
            # Generar datos aleatorios realistas
            temp_promedio = random.uniform(15, 35)
            temp_max = temp_promedio + random.uniform(2, 8)
            temp_min = temp_promedio - random.uniform(2, 8)
            precipitacion = random.uniform(0, 50) if random.random() > 0.6 else 0
            humedad = random.uniform(30, 90)
            
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO datos_climaticos 
                    (estado, fecha, temperatura_max, temperatura_min, temperatura_promedio, precipitacion, humedad)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (estado, fecha_actual.strftime('%Y-%m-%d'), temp_max, temp_min, temp_promedio, precipitacion, humedad))
            except sqlite3.IntegrityError:
                pass  # Ignorar duplicados
            
            fecha_actual += timedelta(days=1)
    
    # Generar predicciones para 2026-2030
    print("\nGenerando predicciones...")
    for estado in ESTADOS:
        for anio in range(2026, 2031):
            for mes in range(1, 13):
                temp_predicha = random.uniform(18, 36)
                precip_predicha = random.uniform(0, 80)
                confianza = random.uniform(0.7, 0.95)
                
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO predicciones 
                        (estado, anio, mes, temperatura_predicha, precipitacion_predicha, confianza)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (estado, anio, mes, temp_predicha, precip_predicha, confianza))
                except sqlite3.IntegrityError:
                    pass
    
    conn.commit()
    conn.close()
    
    print("\n✅ Datos de prueba generados exitosamente!")
    print(f"   - Estados: {len(ESTADOS)}")
    print(f"   - Período: {fecha_inicio.date()} a {fecha_fin.date()}")


if __name__ == "__main__":
    generar_datos_prueba()
