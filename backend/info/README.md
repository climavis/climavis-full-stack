# 📢 Eventos Climáticos - Guía de Actualización

Este directorio contiene el archivo `eventos_climaticos.md` que alimenta la cinta de noticias (ticker) en el dashboard principal.

## 🔄 Cómo Actualizar los Eventos

### Paso 1: Abrir el archivo
Abre el archivo `eventos_climaticos.md` con cualquier editor de texto (Notepad, VS Code, etc.)

### Paso 2: Formato de los eventos
Cada evento debe seguir este formato:

```markdown
**NOMBRE_DEL_ESTADO**: Descripción del evento en texto regular
```

**Importante:**
- El nombre del estado debe estar en **MAYÚSCULAS** y entre `**asteriscos dobles**` para crear negritas
- Después del nombre del estado, coloca dos puntos `:` y un espacio
- La descripción del evento va en texto regular (sin negritas)
- Cada evento debe estar en su propia línea

### Paso 3: Ejemplos

✅ **CORRECTO:**
```markdown
**VERACRUZ**: Continúan esfuerzos por brindar apoyos a familias afectadas por inundaciones y lluvias
**MICHOACÁN**: Monitoreo constante de la actividad del volcán Popocatépetl con semáforo amarillo fase 2
**JALISCO**: Alerta por altas temperaturas y riesgo de incendios forestales en la región
```

❌ **INCORRECTO:**
```markdown
Veracruz: Continúan esfuerzos...  (falta el formato de negritas)
**veracruz**: Continúan esfuerzos...  (debe estar en MAYÚSCULAS)
**VERACRUZ** Continúan esfuerzos...  (faltan los dos puntos)
```

### Paso 4: Guardar los cambios
1. Guarda el archivo `eventos_climaticos.md`
2. Los cambios se reflejarán automáticamente en el dashboard en los próximos **5 minutos**
3. No es necesario reiniciar el servidor

## 🎨 Personalización

### Agregar nuevos eventos
Simplemente agrega una nueva línea con el formato indicado

### Eliminar eventos
Borra la línea completa del evento que ya no esté vigente

### Reordenar eventos
Los eventos aparecen en el orden que están escritos en el archivo. Mueve las líneas para cambiar el orden.

## 🚨 Tips Importantes

- **Claridad**: Escribe descripciones breves y claras (máximo 100-120 caracteres para mejor lectura)
- **Actualidad**: Mantén solo eventos actuales o recientes
- **Revisión**: Revisa semanalmente para eliminar eventos obsoletos
- **No uses saltos de línea** dentro de una descripción de evento

## 📱 Cómo se ve en el Dashboard

Los eventos aparecen en una cinta roja animada debajo del header principal:

```
🔴 EVENTOS EN CURSO • VERACRUZ: Continúan esfuerzos por brindar apoyos... • MICHOACÁN: Monitoreo constante...
```

La animación se desplaza suavemente de derecha a izquierda, permitiendo una lectura cómoda. Los usuarios pueden pausar la animación al pasar el mouse sobre la cinta.

## 🔧 Solución de Problemas

**Los eventos no aparecen:**
- Verifica que el formato sea exactamente como se indica
- Asegúrate de guardar el archivo después de editarlo
- Espera 5 minutos para la actualización automática

**El formato no se ve bien:**
- Revisa que uses `**ESTADO**:` (dos asteriscos antes y después)
- Verifica que el estado esté en MAYÚSCULAS
- Asegúrate de tener un espacio después de los dos puntos

**¿Necesitas ayuda?**
Contacta al equipo de desarrollo o revisa la documentación del proyecto.
