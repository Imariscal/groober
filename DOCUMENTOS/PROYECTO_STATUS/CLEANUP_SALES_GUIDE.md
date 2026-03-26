# 🗑️ Scripts para Eliminar Todas las Ventas

## Archivos Disponibles

### 1. `cleanup_sales_full.sql` - RECOMENDADO (Transacción ACID)
- Elimina todas las ventas y datos relacionados en una transacción
- Si algo falla, **ROLLBACK** automático (sin cambios parciales)
- **Más seguro** ✅

### 2. `cleanup_sales_safe.sql` - Alternativo (Paso a paso)
- Ejecuta sentencias individuales
- Útil si quieres revisar cada paso
- Permite ejecutar las verificaciones (queries SELECT)

---

## 🔧 Cómo Ejecutar

### Opción A: Usando DBeaver (Recomendado)
1. Abre **DBeaver** → Conecta a tu base de datos VibraLive
2. Click derecho en la base de datos → **SQL Editor** → **New SQL Script**
3. Copia el contenido de `cleanup_sales_full.sql`
4. Ejecuta: **Ctrl+Enter** o **F9**
5. Verifica el resultado en la consola

### Opción B: Usando psql (Línea de comandos)
```bash
# Conectar a la base de datos y ejecutar el script
psql -U postgres -d vibralive -f cleanup_sales_full.sql

# O copiar/pegar el contenido directamente en psql
psql -U postgres -d vibralive
```

### Opción C: Desde el Backend (NestJS Terminal)
```bash
# Si tienes acceso directo a TypeORM
npm run typeorm -- query "DELETE FROM sale_payments"
npm run typeorm -- query "DELETE FROM sale_items"
npm run typeorm -- query "DELETE FROM inventory_movements WHERE sale_id IS NOT NULL"
npm run typeorm -- query "DELETE FROM sales"
```

---

## ⚠️ IMPORTANTE

### ¿Qué Elimina?
- ✅ Todas las **sales** (ventas)
- ✅ Todos los **sale_items** (artículos de ventas)
- ✅ Todos los **sale_payments** (pagos registrados)
- ✅ Todos los **inventory_movements** relacionados con ventas

### ¿Qué NO Elimina?
- ❌ Productos (products) - se mantienen intactos
- ❌ Clientes (clients) - se mantienen intactos
- ❌ Stock de productos - se resetea a valores originales

### Orden de Eliminación (Importante)
```
1. sale_payments → depende de sales
2. sale_items → depende de sales  
3. inventory_movements → depende de sales (opcional)
4. sales → tabla principal
```

Este orden respeta las **restricciones de clave foránea** (FK constraints).

---

## ✅ Verificación Post-Eliminación

Después de ejecutar el script, deberías ver:

```
check_sales              | 0
check_items             | 0
check_payments          | 0
check_movements         | 0
```

Si alguno NO es 0, significa que hay datos huérfanos. Ejecuta:
```sql
-- Busca registros anómalosfn
SELECT * FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales);
SELECT * FROM sale_payments WHERE sale_id NOT IN (SELECT id FROM sales);
```

---

## 🚀 Resetear Secuencias (IDs)

Después de limpiar, los IDs volverán a empezar en 1:

```sql
ALTER SEQUENCE sales_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_items_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_payments_id_seq RESTART WITH 1;
```

Esto es **opcional** pero recomendado para empezar limpio.

---

## 🔄 Si Algo Falla

### Con `cleanup_sales_full.sql` (Transacción)
- Se hace **ROLLBACK** automático
- La base de datos vuelve al estado anterior
- ✅ **SEGURO**

### Con `cleanup_sales_safe.sql`
- Ejecuta cada sentencia por separado
- Revisa los errores en la consola
- Puedes ejecutar solo las que funcionan

---

## 📊 Ejemplo de Ejecución

```sql
-- Antes de limpiar
SELECT 'Ventas antes: ' || COUNT(*) FROM sales;  →  100 ventas

-- Ejecutar cleanup_sales_full.sql

-- Después de limpiar
SELECT 'Ventas después: ' || COUNT(*) FROM sales;  →  0 ventas
```

---

## ✨ Recomendaciones

1. **Siempre hacer backup primero**
   ```bash
   pg_dump -U postgres vibralive > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Ejecutar en horario de mantenimiento** (sin usuarios activos)

3. **Si estás en producción**, primero hacer prueba en staging/desarrollo

4. **Verificar** que no hay otro usuario ejecutando queries simultáneamente

---

¡Listo! 🎉 Usa estos scripts para limpiar tu base de datos de manera segura.
