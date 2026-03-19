"""
Coordenadas de las capitales de los 32 estados de México.
Se usan como punto de referencia para las consultas a OpenMeteo.
"""

import unicodedata
from typing import Dict, Optional, Tuple

# Nombre de estado tal como se almacena en la BD → (latitud, longitud)
STATE_COORDINATES: Dict[str, Tuple[float, float]] = {
    "Aguascalientes":       (21.8818, -102.2916),
    "Baja California":      (30.8406, -115.2838),
    "Baja California Sur":  (24.1426, -110.3128),
    "Campeche":             (19.8301, -90.5349),
    "Chiapas":              (16.7528, -93.1152),
    "Chihuahua":            (28.6320, -106.0889),
    "Ciudad de México":     (19.4326, -99.1332),
    "Coahuila":             (25.4232, -100.9924),
    "Colima":               (19.2433, -103.7250),
    "Durango":              (24.0277, -104.6532),
    "Guanajuato":           (21.0190, -101.2574),
    "Guerrero":             (17.5522, -99.5090),
    "Hidalgo":              (20.0911, -98.7624),
    "Jalisco":              (20.6595, -103.3494),
    "Estado de México":     (19.2938, -99.6568),
    "Michoacán":            (19.7060, -101.1950),
    "Morelos":              (18.9261, -99.2357),
    "Nayarit":              (21.7514, -105.2253),
    "Nuevo León":           (25.6714, -100.3090),
    "Oaxaca":               (17.0732, -96.7266),
    "Puebla":               (19.0414, -98.2063),
    "Querétaro":            (20.5888, -100.3899),
    "Quintana Roo":         (21.1619, -86.8515),
    "San Luis Potosí":      (22.1565, -100.9855),
    "Sinaloa":              (24.8091, -107.3940),
    "Sonora":               (29.0729, -110.9559),
    "Tabasco":              (17.9869, -92.9303),
    "Tamaulipas":           (23.7369, -99.1460),
    "Tlaxcala":             (19.3182, -98.2375),
    "Veracruz":             (19.5260, -96.9222),
    "Yucatán":              (20.9670, -89.6237),
    "Zacatecas":            (22.7709, -102.5832),
}

ALL_STATES = list(STATE_COORDINATES.keys())


def get_coords(state: str) -> Tuple[float, float]:
    """Devuelve (lat, lon) para un estado. KeyError si no existe."""
    return STATE_COORDINATES[state]


# ── Normalización de nombres ──────────────────────────────────────────
# El frontend envía nombres en MAYÚSCULAS sin acentos (ej. "CDMX",
# "ESTADO DE MEXICO"), pero la BD almacena nombres canónicos con acentos
# y mayúsculas/minúsculas (ej. "Ciudad de México", "Estado de México").  

def _strip_accents(s: str) -> str:
    """Elimina acentos de una cadena."""
    nfkd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfkd if unicodedata.category(c) != "Mn")


# Aliases especiales del frontend → nombre canónico en BD
_SPECIAL_ALIASES: Dict[str, str] = {
    "CDMX": "Ciudad de México",
}

# Lookup rápido: clave normalizada (UPPER + sin acentos) → nombre BD
_NORMALIZED_LOOKUP: Dict[str, str] = {}
for _db_name in STATE_COORDINATES:
    _key = _strip_accents(_db_name).upper()
    _NORMALIZED_LOOKUP[_key] = _db_name

# Agregar aliases especiales
for _alias, _db_name in _SPECIAL_ALIASES.items():
    _NORMALIZED_LOOKUP[_alias.upper()] = _db_name

# Reverse: nombre BD → clave frontend (UPPER sin acentos)
_DB_TO_FRONTEND: Dict[str, str] = {}
for _db_name in STATE_COORDINATES:
    _DB_TO_FRONTEND[_db_name] = _strip_accents(_db_name).upper()
# Casos especiales
_DB_TO_FRONTEND["Ciudad de México"] = "CDMX"


def resolve_state(frontend_name: str) -> str:
    """
    Convierte un nombre de estado del frontend al formato de la BD.

    Soporta:
      - "AGUASCALIENTES" → "Aguascalientes"
      - "CDMX" → "Ciudad de México"
      - "ESTADO DE MEXICO" → "Estado de México"
      - "MICHOACAN" → "Michoacán"
      - "Ciudad de México" → "Ciudad de México"  (ya canónico)
    """
    # 1. Verificar si ya es un nombre canónico
    if frontend_name in STATE_COORDINATES:
        return frontend_name

    # 2. Buscar en lookup normalizado
    key = _strip_accents(frontend_name).upper()
    return _NORMALIZED_LOOKUP.get(key, frontend_name)


def to_frontend_key(db_name: str) -> str:
    """
    Convierte nombre canónico de BD al formato frontend.

    Ejemplos:
      - "Ciudad de México" → "CDMX"
      - "Estado de México" → "ESTADO DE MEXICO"
      - "Michoacán" → "MICHOACAN"
    """
    return _DB_TO_FRONTEND.get(db_name, _strip_accents(db_name).upper())
