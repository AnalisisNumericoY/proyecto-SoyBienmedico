# 🚀 INSTRUCCIONES - EJECUTAR SQL EN SUPABASE

## 📋 Pasos:

### 1. Abrir Supabase SQL Editor
- Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/editor/sql
- O desde el dashboard: `SQL Editor` en el menú lateral

### 2. Ejecutar Schema (crear tabla)
1. Copia TODO el contenido de `dashclientes-schema-v1.sql`
2. Pégalo en el editor SQL
3. Click en botón `Run` (▶️)
4. Verifica mensaje: "Success. No rows returned"

### 3. Ejecutar Seed (insertar datos demo)
1. Copia TODO el contenido de `dashclientes-seed-demo.sql`
2. Pégalo en el editor SQL (reemplaza el anterior)
3. Click en botón `Run` (▶️)
4. Deberías ver tabla con 3 clientes:
   - coca-cola
   - ecopetrol
   - postobon

### 4. Verificar tabla creada
```sql
-- Ejecuta esta query para ver los datos:
SELECT nombre, nombre_comercial, color_hex, activo FROM clientes;
```

## ✅ Resultado esperado:
```
nombre      | nombre_comercial              | color_hex | activo
------------|-------------------------------|-----------|-------
coca-cola   | Coca-Cola FEMSA Colombia      | #E24B4A   | true
ecopetrol   | Ecopetrol S.A.                | #185FA5   | true
postobon    | Postobón S.A.                 | #FAC775   | true
```

## ⚠️ Si hay error:
- **"relation already exists"**: La tabla ya existe, skip al paso 3
- **"permission denied"**: Verifica que estás en el proyecto correcto
- **"syntax error"**: Copia de nuevo el SQL completo

## 🔄 Siguiente paso:
Una vez ejecutados los 2 archivos SQL, avísame para continuar con el frontend.
