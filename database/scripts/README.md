# Importación de Datos Climáticos

Este directorio contiene scripts para importar y gestionar datos climáticos en la base de datos SQLite.

## Script: `import_csv.py`

Script para importar datos climáticos desde archivos CSV **sin encabezados** a la base de datos.

### Formato del CSV

El archivo CSV debe tener **11 columnas** en el siguiente orden (SIN línea de encabezado):

```
fecha,estado,temp_max_c,temp_min_c,temp_media_c,precipitacion_mm,viento_max_kmh,viento_media_kmh,humedad_max_%,humedad_min_%,humedad_media_%
```

### Descripción de las columnas:

1. **fecha**: Formato `YYYY-MM-DD` (ej: 2000-01-01)
2. **estado**: Nombre del estado en MAYÚSCULAS (ej: NAYARIT, MICHOACÁN)
3. **temp_max_c**: Temperatura máxima en grados Celsius
4. **temp_min_c**: Temperatura mínima en grados Celsius
5. **temp_media_c**: Temperatura media en grados Celsius
6. **precipitacion_mm**: Precipitación en milímetros
7. **viento_max_kmh**: Velocidad máxima del viento en km/h
8. **viento_media_kmh**: Velocidad media del viento en km/h
9. **humedad_max_%**: Humedad máxima en porcentaje
10. **humedad_min_%**: Humedad mínima en porcentaje
11. **humedad_media_%**: Humedad media en porcentaje

### Ejemplo de archivo CSV

**nayarit.csv:**
```
2000-01-01,NAYARIT,28.5,15.2,21.8,0.0,15.0,8.5,85.0,35.0,60.0
2000-01-02,NAYARIT,29.1,16.0,22.5,2.5,12.0,7.0,87.0,38.0,62.5
2000-01-03,NAYARIT,27.8,14.5,21.1,0.0,18.0,10.0,82.0,32.0,57.0
```

**michoacan.csv:**
```
2000-01-01,MICHOACÁN,25.3,10.8,18.0,0.0,10.0,5.5,75.0,28.0,51.5
2000-01-02,MICHOACÁN,26.0,11.5,18.7,1.2,11.0,6.0,78.0,30.0,54.0
2000-01-03,MICHOACÁN,24.5,10.2,17.3,0.0,9.0,5.0,72.0,26.0,49.0
```

### Uso del Script

#### Paso 1: Preparar el archivo CSV

Coloca tu archivo CSV (sin encabezados) en cualquier ubicación. Por ejemplo:
- `c:\Users\Messy\Documents\nayarit.csv`
- `c:\Users\Messy\Documents\michoacan.csv`

#### Paso 2: Ejecutar el script

Abre PowerShell o Terminal y navega al directorio del proyecto:

```powershell
cd "c:\Users\Messy\Music\Interactive Climate Change Dashboard"
```

Ejecuta el script con la ruta al archivo CSV:

```powershell
python database\scripts\import_csv.py "c:\Users\Messy\Documents\nayarit.csv"
```

O si el archivo está en el mismo directorio:

```powershell
python database\scripts\import_csv.py nayarit.csv
```

#### Paso 3: Verificar los resultados

El script mostrará:
- Número de registros procesados
- Número de registros insertados
- Número de registros duplicados (si los hay)
- Errores encontrados (si los hay)
- Total de registros antes y después de la importación

### Ejemplo de Salida

```
============================================================
   Importando datos climáticos
============================================================

📁 Archivo CSV: nayarit.csv
🗄️  Base de datos: c:\...\clima_historico.sqlite
⚙️  Modo: Ignorar duplicados

✓ 1000 registros insertados...
✓ 2000 registros insertados...
✓ 3000 registros insertados...

============================================================
   Resumen de la importación
============================================================

📊 Registros procesados:  3,287
✅ Registros insertados:  3,287
⏭️  Registros duplicados:  0
❌ Errores:               0

🗄️  Total en BD (antes):  301,029
🗄️  Total en BD (ahora):  304,316
📈 Incremento:            3,287

✅ Importación completada exitosamente!
```

### Características

✅ **Sin encabezados**: El script no requiere línea de encabezado en el CSV  
✅ **Detección de duplicados**: Ignora automáticamente registros duplicados (fecha + estado)  
✅ **Validación de datos**: Verifica el formato y tipo de datos  
✅ **Manejo de errores**: Reporta líneas con errores sin detener la importación  
✅ **Progreso en tiempo real**: Muestra el progreso cada 1000 registros  
✅ **Resumen detallado**: Estadísticas completas al finalizar  

### Notas Importantes

⚠️ **Estados faltantes actualmente**: NAYARIT y MICHOACÁN  
⚠️ **Formato de fecha**: Debe ser YYYY-MM-DD (ejemplo: 2000-01-01)  
⚠️ **Nombre del estado**: Debe estar en MAYÚSCULAS  
⚠️ **Valores nulos**: Si un valor está vacío, el script lo manejará como NULL  
⚠️ **Duplicados**: Por defecto, los duplicados se ignoran (no se sobrescriben)  

### Solución de Problemas

**Error: "El archivo no existe"**
- Verifica que la ruta al archivo CSV sea correcta
- Usa comillas si la ruta contiene espacios

**Error: "Formato incorrecto"**
- Asegúrate de que cada línea tenga exactamente 11 columnas
- Verifica que no haya comas adicionales o faltantes

**Error: "Error de conversión de datos"**
- Verifica que los números sean válidos (sin letras)
- Revisa que las fechas estén en formato YYYY-MM-DD

**No se insertaron registros**
- Puede que todos los registros ya existan en la base de datos
- Verifica el mensaje de "Registros duplicados"

### Scripts Adicionales

- **`check_db.py`**: Verifica el contenido de la base de datos
- **`populate_data.py`**: Genera datos de prueba para todos los estados
- **`create_database.py`**: Crea la estructura de la base de datos

### Soporte

Si encuentras problemas, verifica:
1. Que Python esté instalado (versión 3.7 o superior)
2. Que la base de datos exista en `database/clima_historico.sqlite`
3. Que el formato del CSV sea correcto
4. Los mensajes de error específicos que muestra el script
