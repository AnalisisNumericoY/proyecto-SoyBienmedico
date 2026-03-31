# 🧪 Quick Test - API Evaluación Riesgo Cardiovascular

## ⚡ Prueba Rápida con cURL (PowerShell)

### 1. Login y Obtener Token
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"username":"paciente123","password":"pass123","role":"paciente"}'

$token = $response.token
Write-Host "✅ Token obtenido:" $token
Write-Host "Usuario:" $response.user.username "| Role:" $response.user.role
```

### 2. Crear Evaluación de Riesgo Cardiovascular
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    paciente_id = "PAC001"
    datos_entrada = @{
        edad = 55
        sexo = "masculino"
        fumador = $true
        diabetes = $true
        hipertension = $true
        cardiovascular = $false
        renal = $false
        sistolica = 145
        diastolica = 95
        frecuencia = 78
        conoceColesterol = $true
        colesterolTotal = 240
        hdl = 35
        hba1c = 7.2
    }
} | ConvertTo-Json -Depth 10

$evaluacion = Invoke-RestMethod -Uri "http://localhost:3000/api/evaluaciones/riesgo-cardiovascular" `
    -Method POST `
    -Headers $headers `
    -Body $body

Write-Host "`n✅ Evaluación creada:"
Write-Host "ID:" $evaluacion.data.evaluacion_id
Write-Host "Riesgo:" $evaluacion.data.resultado.categoria "(" $evaluacion.data.resultado.riesgo ")"
Write-Host "PDF URL:" $evaluacion.data.pdf_url

$evaluacionId = $evaluacion.data.evaluacion_id
```

### 3. Consultar Evaluación Creada
```powershell
$evaluacionDetalle = Invoke-RestMethod -Uri "http://localhost:3000/api/evaluaciones/$evaluacionId" `
    -Method GET `
    -Headers $headers

Write-Host "`n✅ Evaluación consultada:"
Write-Host "Fecha:" $evaluacionDetalle.data.fecha
Write-Host "Puntuación PAHO:" $evaluacionDetalle.data.resultado.puntuacion
Write-Host "Recomendaciones:" $evaluacionDetalle.data.resultado.recomendaciones.Count
```

### 4. Ver Historial del Paciente
```powershell
$historial = Invoke-RestMethod -Uri "http://localhost:3000/api/evaluaciones/paciente/PAC001" `
    -Method GET `
    -Headers $headers

Write-Host "`n✅ Historial del paciente:"
Write-Host "Total evaluaciones:" $historial.data.total
$historial.data.evaluaciones | ForEach-Object {
    Write-Host "  - $($_.fecha): $($_.resultado.categoria) - $($_.resultado.riesgo)"
}
```

### 5. Descargar PDF
```powershell
$pdfPath = "evaluacion_$evaluacionId.pdf"
Invoke-WebRequest -Uri "http://localhost:3000/api/evaluaciones/$evaluacionId/pdf" `
    -Method GET `
    -Headers $headers `
    -OutFile $pdfPath

Write-Host "`n✅ PDF descargado:" $pdfPath
Start-Process $pdfPath
```

---

## 📮 Colección Postman

### Request 1: Login Paciente
```
POST http://localhost:3000/auth/login

Headers:
Content-Type: application/json

Body (raw JSON):
{
  "username": "paciente123",
  "password": "pass123",
  "role": "paciente"
}

Tests (guardar token):
pm.environment.set("token_paciente", pm.response.json().token);
pm.environment.set("paciente_id", pm.response.json().user.paciente_id);
```

### Request 2: Crear Evaluación
```
POST http://localhost:3000/api/evaluaciones/riesgo-cardiovascular

Headers:
Authorization: Bearer {{token_paciente}}
Content-Type: application/json

Body (raw JSON):
{
  "paciente_id": "{{paciente_id}}",
  "datos_entrada": {
    "edad": 55,
    "sexo": "masculino",
    "fumador": true,
    "diabetes": true,
    "hipertension": true,
    "cardiovascular": false,
    "renal": false,
    "sistolica": 145,
    "diastolica": 95,
    "frecuencia": 78,
    "conoceColesterol": true,
    "colesterolTotal": 240,
    "hdl": 35,
    "hba1c": 7.2
  }
}

Tests (guardar ID):
const response = pm.response.json();
if (response.success) {
  pm.environment.set("evaluacion_id", response.data.evaluacion_id);
  console.log("Evaluación creada:", response.data.evaluacion_id);
  console.log("Riesgo:", response.data.resultado.categoria);
}
```

### Request 3: Obtener Evaluación
```
GET http://localhost:3000/api/evaluaciones/{{evaluacion_id}}

Headers:
Authorization: Bearer {{token_paciente}}
```

### Request 4: Historial Paciente
```
GET http://localhost:3000/api/evaluaciones/paciente/{{paciente_id}}

Headers:
Authorization: Bearer {{token_paciente}}

Query Params (opcionales):
tipo: riesgo_cardiovascular
limit: 10
offset: 0
```

### Request 5: Descargar PDF
```
GET http://localhost:3000/api/evaluaciones/{{evaluacion_id}}/pdf

Headers:
Authorization: Bearer {{token_paciente}}

Settings:
Send and download (para descargar el archivo)
```

---

## 🔐 Credenciales de Prueba

| Usuario | Password | Role | Paciente ID | Médico ID |
|---------|----------|------|-------------|-----------|
| paciente123 | pass123 | paciente | PAC001 | - |
| doctor123 | pass123 | medico | - | DOC001 |
| admin | pass123 | admin | - | - |

---

## ✅ Checklist Testing Rápido

- [ ] Login devuelve token JWT
- [ ] POST /api/evaluaciones/riesgo-cardiovascular devuelve 201
- [ ] Respuesta incluye `evaluacion_id`, `resultado`, `pdf_url`
- [ ] GET /api/evaluaciones/{id} devuelve datos completos
- [ ] GET /api/evaluaciones/paciente/{id} devuelve array de evaluaciones
- [ ] GET /api/evaluaciones/{id}/pdf descarga PDF válido
- [ ] PDF contiene: header, parámetros, resultado, recomendaciones
- [ ] Validación funciona: edad < 18 devuelve 400

---

## 🐛 Solución de Problemas

### Error: "Todos los campos son requeridos"
**Causa**: Falta el campo `role` en el request de login  
**Solución**: Agregar `"role": "paciente"` al body

### Error: "Contraseña incorrecta"
**Causa**: Las credenciales fueron actualizadas  
**Solución**: Usar `pass123` (no `password`)

### Error: "Token no proporcionado"
**Causa**: Falta header `Authorization`  
**Solución**: Agregar `Authorization: Bearer {TOKEN}`

### Error 403: "No tiene permisos"
**Causa**: Paciente intenta acceder a evaluación de otro  
**Solución**: Usar evaluación propia o login como médico/admin

### PDF no se genera
**Causa**: Directorio pdfs/evaluaciones no existe  
**Solución**: Ya está creado, verificar permisos de escritura

---

## 📊 Ejemplo Completo de Flujo

```powershell
# 1. Login
$login = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"paciente123","password":"pass123","role":"paciente"}'
$token = $login.token

# 2. Crear evaluación
$headers = @{"Authorization"="Bearer $token"; "Content-Type"="application/json"}
$body = '{"paciente_id":"PAC001","datos_entrada":{"edad":55,"sexo":"masculino","fumador":true,"diabetes":false,"hipertension":false,"cardiovascular":false,"renal":false,"sistolica":130,"diastolica":85,"frecuencia":72,"conoceColesterol":true,"colesterolTotal":200,"hdl":50}}'
$eval = Invoke-RestMethod -Uri "http://localhost:3000/api/evaluaciones/riesgo-cardiovascular" -Method POST -Headers $headers -Body $body

# 3. Ver resultado
Write-Host "Riesgo:" $eval.data.resultado.categoria "(" $eval.data.resultado.riesgo ")"
Write-Host "Puntuación:" $eval.data.resultado.puntuacion

# 4. Descargar PDF
Invoke-WebRequest -Uri "http://localhost:3000/api/evaluaciones/$($eval.data.evaluacion_id)/pdf" -Headers $headers -OutFile "evaluacion.pdf"
Start-Process "evaluacion.pdf"
```
