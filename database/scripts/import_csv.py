"""
Script para importar datos climáticos desde archivos CSV a la base de datos SQLite
Compatible con archivos CSV sin encabezados

Formato esperado del CSV (sin encabezado):
fecha,estado,temp_max_c,temp_min_c,temp_media_c,precipitacion_mm,viento_max_kmh,viento_media_kmh,humedad_max_%,humedad_min_%,humedad_media_%

Ejemplo:
2000-01-01,NAYARIT,28.5,15.2,21.8,0.0,15.0,8.5,85.0,35.0,60.0

Uso:
    python import_csv.py ruta/al/archivo.csv
    python import_csv.py nayarit.csv
    python import_csv.py michoacan.csv
"""

import sqlite3
import csv
import sys
import os
from pathlib import Path

# Ruta de la base de datos
DB_PATH = Path(__file__).parent.parent / "clima_historico.sqlite"

def import_csv(csv_file_path, skip_duplicates=True):
    """
    Importa datos desde un archivo CSV a la base de datos
    
    Args:
        csv_file_path: Ruta al archivo CSV
        skip_duplicates: Si True, ignora registros duplicados (por defecto True)
    """
    
    if not os.path.exists(csv_file_path):
        print(f"❌ Error: El archivo no existe: {csv_file_path}")
        return False
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Error: Base de datos no encontrada: {DB_PATH}")
        return False
    
    print(f"\n{'='*60}")
    print(f"   Importando datos climáticos")
    print(f"{'='*60}\n")
    print(f"📁 Archivo CSV: {csv_file_path}")
    print(f"🗄️  Base de datos: {DB_PATH}")
    print(f"⚙️  Modo: {'Ignorar duplicados' if skip_duplicates else 'Permitir duplicados'}\n")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Contar registros antes
        cursor.execute("SELECT COUNT(*) FROM history")
        registros_antes = cursor.fetchone()[0]
        
        registros_procesados = 0
        registros_insertados = 0
        registros_duplicados = 0
        errores = 0
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            
            for line_num, row in enumerate(csv_reader, start=1):
                registros_procesados += 1
                
                # Validar que la fila tenga 11 columnas
                if len(row) != 11:
                    print(f"⚠️  Línea {line_num}: Formato incorrecto (esperadas 11 columnas, encontradas {len(row)})")
                    errores += 1
                    continue
                
                try:
                    fecha = row[0].strip()
                    estado = row[1].strip().upper()
                    temp_max = float(row[2]) if row[2].strip() else None
                    temp_min = float(row[3]) if row[3].strip() else None
                    temp_media = float(row[4]) if row[4].strip() else None
                    precipitacion = float(row[5]) if row[5].strip() else None
                    viento_max = float(row[6]) if row[6].strip() else None
                    viento_media = float(row[7]) if row[7].strip() else None
                    humedad_max = float(row[8]) if row[8].strip() else None
                    humedad_min = float(row[9]) if row[9].strip() else None
                    humedad_media = float(row[10]) if row[10].strip() else None
                    
                    # Insertar en la base de datos
                    if skip_duplicates:
                        # Verificar si ya existe
                        cursor.execute(
                            "SELECT COUNT(*) FROM history WHERE fecha = ? AND estado = ?",
                            (fecha, estado)
                        )
                        if cursor.fetchone()[0] > 0:
                            registros_duplicados += 1
                            continue
                    
                    cursor.execute("""
                        INSERT INTO history (
                            fecha, estado, temp_max_c, temp_min_c, temp_media_c,
                            precipitacion_mm, viento_max_kmh, viento_media_kmh,
                            "humedad_max_%", "humedad_min_%", "humedad_media_%"
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        fecha, estado, temp_max, temp_min, temp_media,
                        precipitacion, viento_max, viento_media,
                        humedad_max, humedad_min, humedad_media
                    ))
                    
                    registros_insertados += 1
                    
                    # Mostrar progreso cada 1000 registros
                    if registros_insertados % 1000 == 0:
                        print(f"✓ {registros_insertados} registros insertados...")
                
                except ValueError as e:
                    print(f"⚠️  Línea {line_num}: Error de conversión de datos - {e}")
                    errores += 1
                except Exception as e:
                    print(f"⚠️  Línea {line_num}: Error inesperado - {e}")
                    errores += 1
        
        # Confirmar los cambios
        conn.commit()
        
        # Contar registros después
        cursor.execute("SELECT COUNT(*) FROM history")
        registros_despues = cursor.fetchone()[0]
        
        conn.close()
        
        # Resumen
        print(f"\n{'='*60}")
        print(f"   Resumen de la importación")
        print(f"{'='*60}\n")
        print(f"📊 Registros procesados:  {registros_procesados:,}")
        print(f"✅ Registros insertados:  {registros_insertados:,}")
        if skip_duplicates:
            print(f"⏭️  Registros duplicados:  {registros_duplicados:,}")
        print(f"❌ Errores:               {errores:,}")
        print(f"\n🗄️  Total en BD (antes):  {registros_antes:,}")
        print(f"🗄️  Total en BD (ahora):  {registros_despues:,}")
        print(f"📈 Incremento:            {registros_despues - registros_antes:,}\n")
        
        if registros_insertados > 0:
            print("✅ Importación completada exitosamente!\n")
            return True
        else:
            print("⚠️  No se insertaron registros nuevos.\n")
            return False
            
    except sqlite3.Error as e:
        print(f"\n❌ Error de base de datos: {e}\n")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}\n")
        return False


def main():
    if len(sys.argv) < 2:
        print("\n" + "="*60)
        print("   Script de Importación de Datos Climáticos")
        print("="*60 + "\n")
        print("Uso:")
        print(f"  python {os.path.basename(__file__)} <archivo.csv>")
        print(f"\nEjemplo:")
        print(f"  python {os.path.basename(__file__)} nayarit.csv")
        print(f"  python {os.path.basename(__file__)} michoacan.csv")
        print("\nFormato del CSV (SIN encabezado):")
        print("  fecha,estado,temp_max_c,temp_min_c,temp_media_c,precipitacion_mm,")
        print("  viento_max_kmh,viento_media_kmh,humedad_max_%,humedad_min_%,humedad_media_%")
        print("\nEjemplo de línea:")
        print("  2000-01-01,NAYARIT,28.5,15.2,21.8,0.0,15.0,8.5,85.0,35.0,60.0")
        print("\n" + "="*60 + "\n")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    success = import_csv(csv_file)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
