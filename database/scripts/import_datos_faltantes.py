"""
Script para importar datos_faltantes.csv con formato de fecha DD/MM/YYYY
Este script convierte automáticamente las fechas al formato correcto para la base de datos
"""

import sqlite3
import csv
from pathlib import Path
from datetime import datetime

# Ruta de la base de datos
DB_PATH = Path(__file__).parent.parent / "clima_historico.sqlite"
CSV_PATH = Path(__file__).parent.parent.parent / "datos_faltantes.csv"

def import_datos_faltantes():
    """
    Importa datos desde datos_faltantes.csv con conversión de formato de fecha
    """
    
    if not CSV_PATH.exists():
        print(f"❌ Error: El archivo no existe: {CSV_PATH}")
        return False
    
    if not DB_PATH.exists():
        print(f"❌ Error: Base de datos no encontrada: {DB_PATH}")
        return False
    
    print(f"\n{'='*60}")
    print(f"   Importando Datos Faltantes (Michoacán y Nayarit)")
    print(f"{'='*60}\n")
    print(f"📁 Archivo CSV: {CSV_PATH}")
    print(f"🗄️  Base de datos: {DB_PATH}")
    print(f"⚙️  Conversión automática: DD/MM/YYYY → YYYY-MM-DD\n")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Contar registros antes
        cursor.execute("SELECT COUNT(*) FROM history")
        registros_antes = cursor.fetchone()[0]
        
        # Contar estados antes
        cursor.execute("SELECT COUNT(DISTINCT estado) FROM history")
        estados_antes = cursor.fetchone()[0]
        
        registros_procesados = 0
        registros_insertados = 0
        registros_duplicados = 0
        errores = 0
        estados_encontrados = set()
        
        with open(CSV_PATH, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            
            for line_num, row in enumerate(csv_reader, start=1):
                registros_procesados += 1
                
                # Validar que la fila tenga 11 columnas
                if len(row) != 11:
                    print(f"⚠️  Línea {line_num}: Formato incorrecto (esperadas 11 columnas, encontradas {len(row)})")
                    errores += 1
                    continue
                
                try:
                    # Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
                    fecha_original = row[0].strip()
                    try:
                        fecha_obj = datetime.strptime(fecha_original, '%d/%m/%Y')
                        fecha = fecha_obj.strftime('%Y-%m-%d')
                    except ValueError:
                        # Si falla, intentar con formato alternativo
                        try:
                            fecha_obj = datetime.strptime(fecha_original, '%Y-%m-%d')
                            fecha = fecha_original
                        except ValueError:
                            print(f"⚠️  Línea {line_num}: Formato de fecha inválido: {fecha_original}")
                            errores += 1
                            continue
                    
                    estado = row[1].strip().upper()
                    estados_encontrados.add(estado)
                    
                    temp_max = float(row[2]) if row[2].strip() else None
                    temp_min = float(row[3]) if row[3].strip() else None
                    temp_media = float(row[4]) if row[4].strip() else None
                    precipitacion = float(row[5]) if row[5].strip() else None
                    viento_max = float(row[6]) if row[6].strip() else None
                    viento_media = float(row[7]) if row[7].strip() else None
                    humedad_max = float(row[8]) if row[8].strip() else None
                    humedad_min = float(row[9]) if row[9].strip() else None
                    humedad_media = float(row[10]) if row[10].strip() else None
                    
                    # Verificar si ya existe
                    cursor.execute(
                        "SELECT COUNT(*) FROM history WHERE fecha = ? AND estado = ?",
                        (fecha, estado)
                    )
                    if cursor.fetchone()[0] > 0:
                        registros_duplicados += 1
                        continue
                    
                    # Insertar en la base de datos
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
                        print(f"✓ {registros_insertados:,} registros insertados...")
                
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
        
        # Contar estados después
        cursor.execute("SELECT COUNT(DISTINCT estado) FROM history")
        estados_despues = cursor.fetchone()[0]
        
        # Verificar los estados importados
        print("\n" + "="*60)
        print("   Estados encontrados en el archivo")
        print("="*60)
        for estado in sorted(estados_encontrados):
            cursor.execute("SELECT COUNT(*) FROM history WHERE estado = ?", (estado,))
            count = cursor.fetchone()[0]
            print(f"  📍 {estado}: {count:,} registros")
        
        conn.close()
        
        # Resumen
        print(f"\n{'='*60}")
        print(f"   Resumen de la importación")
        print(f"{'='*60}\n")
        print(f"📊 Registros procesados:  {registros_procesados:,}")
        print(f"✅ Registros insertados:  {registros_insertados:,}")
        print(f"⏭️  Registros duplicados:  {registros_duplicados:,}")
        print(f"❌ Errores:               {errores:,}")
        print(f"\n🗄️  Total en BD (antes):  {registros_antes:,}")
        print(f"🗄️  Total en BD (ahora):  {registros_despues:,}")
        print(f"📈 Incremento:            {registros_despues - registros_antes:,}")
        print(f"\n🗺️  Estados (antes):      {estados_antes}")
        print(f"🗺️  Estados (ahora):      {estados_despues}")
        print(f"📈 Nuevos estados:        {estados_despues - estados_antes}\n")
        
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


if __name__ == "__main__":
    import sys
    success = import_datos_faltantes()
    sys.exit(0 if success else 1)
