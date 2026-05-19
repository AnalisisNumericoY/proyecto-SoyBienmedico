# 🧪 Testing Guide - PDF API

Guía para probar los endpoints de la PDF API.

## Prerequisitos

1. Servidor PDF API corriendo en puerto 3001
2. Servidor principal de SoyBienmedico corriendo en puerto 3000 (para obtener JWT)
3. Usuario autenticado en el sistema principal

---

## 1. Obtener Token JWT

### Opción A: Desde el navegador

1. Iniciar sesión en SoyBienmedico (cualquier rol)
2. Abrir DevTools (F12) → Console
3. Ejecutar:
```javascript
console.log(localStorage.getItem('token'));
```
4. Copiar el token

### Opción B: Desde API (cURL)

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tu_usuario",
    "password": "tu_password"
  }'
```

Copiar el token de la respuesta.

---

## 2. Testear Health Check

```bash
curl http://localhost:3001/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "service": "SoyBienmedico PDF API",
  "version": "1.0.0"
}
```

---

## 3. Testear Endpoint Riesgo Cardiovascular

### Con cURL

```bash
# Reemplazar <TOKEN> con tu JWT
curl -X POST http://localhost:3001/api/internal/pdf/riesgo-cardiovascular \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d @examples/riesgo-cardiovascular-request.json \
  --output test-riesgo-cv.pdf
```

### Con PowerShell

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Tu token JWT

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = Get-Content -Path "examples\riesgo-cardiovascular-request.json" -Raw

Invoke-WebRequest `
    -Uri "http://localhost:3001/api/internal/pdf/riesgo-cardiovascular" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -OutFile "test-result.pdf"

Write-Host "✅ PDF generado: test-result.pdf"
```

### Con JavaScript (Navegador)

```javascript
// Ejecutar en DevTools Console después de iniciar sesión
const token = localStorage.getItem('token');

const datos = {
  paciente: {
    id: crypto.randomUUID(),
    nombre: "Juan",
    apellidos: "Pérez",
    tipo_documento: "CC",
    numero_documento: "123456789",
    fecha_nacimiento: "1978-05-15T00:00:00.000Z",
    sexo: "hombre"
  },
  evaluacion: {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
    datos_entrada: {
      edad: 48,
      sexo: "masculino",
      fumador: true,
      diabetes: false,
      hipertension: true,
      sistolica: 145,
      diastolica: 92,
      frecuencia: 78
    }
  },
  resultado: {
    categoria: "MODERADO",
    riesgo: "Riesgo moderado a 10 años: 5%",
    puntuacion: 12,
    recomendaciones: [
      "Consulte con su médico",
      "Monitoree su presión arterial"
    ]
  }
};

fetch('http://localhost:3001/api/internal/pdf/riesgo-cardiovascular', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(datos)
})
.then(res => res.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test-riesgo-cv.pdf';
  a.click();
  console.log('✅ PDF descargado');
});
```

---

## 4. Verificar Errores

### Token inválido (401)

```bash
curl -X POST http://localhost:3001/api/internal/pdf/riesgo-cardiovascular \
  -H "Authorization: Bearer token_invalido" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "error": "Token inválido",
  "code": "INVALID_TOKEN"
}
```

### Datos faltantes (400)

```bash
curl -X POST http://localhost:3001/api/internal/pdf/riesgo-cardiovascular \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta esperada:**
```json
{
  "success": false,
  "error": "Datos del paciente requeridos",
  "code": "MISSING_PACIENTE"
}
```

---

## 5. Checklist de Testing

- [ ] Health check responde OK
- [ ] API Info lista endpoints correctos
- [ ] Token inválido retorna 401
- [ ] Request sin datos retorna 400
- [ ] Request completo genera PDF correctamente
- [ ] PDF descargado se abre sin errores
- [ ] PDF contiene todos los datos del paciente
- [ ] PDF muestra resultado con color correcto
- [ ] PDF incluye recomendaciones

---

## 6. Logs Esperados

Al generar un PDF exitosamente, deberías ver en la consola del servidor:

```
2026-05-19T00:00:00.000Z - POST /api/internal/pdf/riesgo-cardiovascular
✅ JWT validado - Usuario: juan.perez (paciente)
📄 Generando PDF de Riesgo Cardiovascular...
✅ PDF generado exitosamente - Tamaño: 45.67 KB
```

---

## 7. Troubleshooting

### Error: "Cannot find module"

```bash
cd services/pdf-api
npm install
```

### Error: "ECONNREFUSED"

Verificar que el servidor esté corriendo:
```bash
node server.js
```

### Error: "JWT Secret mismatch"

Verificar que el `.env` del PDF API tenga el mismo `JWT_SECRET` que el servidor principal.

---

## 📊 Performance Benchmarks

Ejecutar 10 requests y medir tiempo:

```bash
for i in {1..10}; do
  time curl -X POST http://localhost:3001/api/internal/pdf/riesgo-cardiovascular \
    -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d @examples/riesgo-cardiovascular-request.json \
    --output /dev/null
done
```

**Tiempo esperado:** 200-500ms por PDF
