import sqlite3
import os

# Conectar a la base de datos
db_path = os.path.join(os.path.dirname(__file__), '../clima_historico.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Ver tablas
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
print('=== TABLAS ===')
for table in cursor.fetchall():
    print(f"  - {table[0]}")

# Ver estructura de history
cursor.execute('PRAGMA table_info(history)')
print('\n=== ESTRUCTURA history ===')
columns = []
for col in cursor.fetchall():
    columns.append(col[1])
    print(f"  {col[1]} ({col[2]})")

# Ver algunos datos
cursor.execute('SELECT * FROM history LIMIT 5')
print('\n=== EJEMPLO DE DATOS (primeros 5 registros) ===')
rows = cursor.fetchall()
for row in rows:
    print(row)

# Ver estados disponibles si existe columna estado/state
if 'estado' in columns:
    cursor.execute('SELECT DISTINCT estado FROM history ORDER BY estado')
    print('\n=== ESTADOS DISPONIBLES ===')
    estados = cursor.fetchall()
    for estado in estados:
        print(f"  - {estado[0]}")
    print(f"\nTotal: {len(estados)} estados")
elif 'state' in columns:
    cursor.execute('SELECT DISTINCT state FROM history ORDER BY state')
    print('\n=== ESTADOS DISPONIBLES ===')
    estados = cursor.fetchall()
    for estado in estados:
        print(f"  - {estado[0]}")
    print(f"\nTotal: {len(estados)} estados")

# Ver rango de fechas
if 'fecha' in columns:
    cursor.execute('SELECT MIN(fecha), MAX(fecha), COUNT(*) FROM history')
    min_fecha, max_fecha, total = cursor.fetchone()
    print(f'\n=== RANGO DE FECHAS ===')
    print(f"  Desde: {min_fecha}")
    print(f"  Hasta: {max_fecha}")
    print(f"  Total registros: {total}")
elif 'date' in columns:
    cursor.execute('SELECT MIN(date), MAX(date), COUNT(*) FROM history')
    min_fecha, max_fecha, total = cursor.fetchone()
    print(f'\n=== RANGO DE FECHAS ===')
    print(f"  Desde: {min_fecha}")
    print(f"  Hasta: {max_fecha}")
    print(f"  Total registros: {total}")

conn.close()
