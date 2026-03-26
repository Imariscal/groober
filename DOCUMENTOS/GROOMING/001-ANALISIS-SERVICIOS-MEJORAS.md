# 📊 Análisis UI - Servicios y Mejoras

## Estado Actual

### ✅ Lo que funciona bien
- Vista de grillas y tabla están claras
- Información básica visible: nombre, categoría, precio, duración
- Estados (Activo/Inactivo) bien identificados
- Modal de creación tiene estructura correcta

### ⚠️ Mejoras Necesarias

#### 1. **Duración por Tamaño de Mascota - URGENTE**
- **Problema:** Modal no tiene campos para duración por tamaño
- **Actual:** Solo duración general (5, 30 min)
- **Requerido:** La duración DEBE variar por tamaño (XS, S, M, L, XL)
- **Solución:** 
  - Agregar tabla en modal con columnas: Tamaño | Duración (min) | Precio
  - O sección desplegable por cada tamaño

#### 2. **Claridad de Precios vs Duración**
- **Problema:** No está claro si precio incluye duración específica
- **Requerido:** Explicar que cada tamaño tiene:
  - Duración independiente en minutos
  - Precio independiente
- **Solución:** Agregar help text: "Cada tamaño tiene su duración y precio independientes"

#### 3. **Validaciones**
- Duración mínima: 5 minutos
- Duración máxima: 480 minutos (8 horas)
- Precio mínimo: 0
- No permitir duplicados de tamaño en mismos precios

#### 4. **Interfaz Modal**
- Reorganizar secciones: Básica → Duración General → Configurar por Tamaño
- Hacer más evidente la tabla de tamaños/duraciones/precios
- Botón para "Aplicar duración a todos los tamaños" (copiar valor)

#### 5. **Vista de Servicios**
- Mostrar los 5 tamaños y sus duraciones al hacer hover en duración
- O agregar columna expandible "Duraciones por tamaño"

## Prioridad
1. **CRÍTICO:** Agregar campos duración por tamaño en modal
2. **ALTO:** Mejorar claridad de relación precio-duración
3. **MEDIO:** Validaciones completas
4. **BAJO:** UX improvements en layout

## Impacto en Citas
⚠️ **Nota:** Sin duraciones por tamaño, las citas grooming usarán defaultDurationMinutes incorrecto
