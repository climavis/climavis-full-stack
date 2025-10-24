"""
Utilidades para procesar e interpretar datos climáticos
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta


def calcular_promedios_mensuales(datos: List[Dict]) -> Dict[str, float]:
    """
    Calcula promedios mensuales de temperatura y precipitación
    
    Args:
        datos: Lista de diccionarios con datos climáticos
        
    Returns:
        Diccionario con promedios calculados
    """
    if not datos:
        return {}
    
    temp_sum = sum(d.get('temperatura_promedio', 0) for d in datos if d.get('temperatura_promedio'))
    precip_sum = sum(d.get('precipitacion', 0) for d in datos if d.get('precipitacion'))
    
    count = len(datos)
    
    return {
        'temperatura_promedio': temp_sum / count if count > 0 else 0,
        'precipitacion_total': precip_sum,
        'dias_con_datos': count
    }


def interpretar_tendencia(datos_historicos: List[Dict]) -> str:
    """
    Interpreta la tendencia climática basándose en datos históricos
    
    Args:
        datos_historicos: Lista de datos ordenados por fecha
        
    Returns:
        String describiendo la tendencia (ej: "aumento", "disminución", "estable")
    """
    if len(datos_historicos) < 2:
        return "datos insuficientes"
    
    # Calcular tendencia de temperatura
    primera_mitad = datos_historicos[:len(datos_historicos)//2]
    segunda_mitad = datos_historicos[len(datos_historicos)//2:]
    
    temp_primera = sum(d.get('temperatura_promedio', 0) for d in primera_mitad) / len(primera_mitad)
    temp_segunda = sum(d.get('temperatura_promedio', 0) for d in segunda_mitad) / len(segunda_mitad)
    
    diferencia = temp_segunda - temp_primera
    
    if abs(diferencia) < 0.5:
        return "estable"
    elif diferencia > 0:
        return "aumento"
    else:
        return "disminución"


def generar_estadisticas(datos: List[Dict]) -> Dict[str, Any]:
    """
    Genera estadísticas descriptivas de los datos climáticos
    
    Args:
        datos: Lista de datos climáticos
        
    Returns:
        Diccionario con estadísticas calculadas
    """
    if not datos:
        return {}
    
    temperaturas = [d.get('temperatura_promedio', 0) for d in datos if d.get('temperatura_promedio')]
    precipitaciones = [d.get('precipitacion', 0) for d in datos if d.get('precipitacion')]
    
    return {
        'temperatura': {
            'max': max(temperaturas) if temperaturas else 0,
            'min': min(temperaturas) if temperaturas else 0,
            'promedio': sum(temperaturas) / len(temperaturas) if temperaturas else 0
        },
        'precipitacion': {
            'max': max(precipitaciones) if precipitaciones else 0,
            'min': min(precipitaciones) if precipitaciones else 0,
            'total': sum(precipitaciones) if precipitaciones else 0
        },
        'registros_totales': len(datos)
    }
