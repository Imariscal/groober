# ============================================================
# Groober Beta - Ejecutar Database Migrations
# ============================================================

# VARIABLES (DEL ARCHIVO DE CREDENCIALES)
$databaseHost = "groober-db-beta.postgres.database.azure.com"
$databasePort = "5432"
$databaseUser = "groober_admin"
$databasePassword = ">369O,{C|hy0KBWcu&vl`4znk.tY7gp!"
$databaseName = "groober_beta"
$backendPath = ".\vibralive-backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Groober Beta - Database Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Navigate a backend
Write-Host "1. Navegando a carpeta backend..." -ForegroundColor Yellow
if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: No encontre la carpeta $backendPath" -ForegroundColor Red
    exit 1
}
Push-Location $backendPath
Write-Host "OK - En: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 2. Instalar dependencias
Write-Host "2. Instalando dependencias..." -ForegroundColor Yellow
npm ci
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# 3. Configurar variables de entorno
Write-Host "3. Configurando variables de entorno..." -ForegroundColor Yellow
$env:DATABASE_HOST = $databaseHost
$env:DATABASE_PORT = $databasePort
$env:DATABASE_USER = $databaseUser
$env:DATABASE_PASSWORD = $databasePassword
$env:DATABASE_NAME = $databaseName
$env:NODE_ENV = "beta"

Write-Host "   DATABASE_HOST: $databaseHost" -ForegroundColor Gray
Write-Host "   DATABASE_USER: $databaseUser" -ForegroundColor Gray
Write-Host "   DATABASE_NAME: $databaseName" -ForegroundColor Gray
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# 4. Ejecutar migrations
Write-Host "4. Ejecutando migrations..." -ForegroundColor Yellow
Write-Host "   (Esto puede tardar 1-2 minutos)" -ForegroundColor Gray
npm run migration:run

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Migrations ejecutadas exitosamente" -ForegroundColor Green
} else {
    Write-Host "ERROR - Las migrations fallaron" -ForegroundColor Red
    Write-Host "Revisa los logs arriba para mas detalles" -ForegroundColor Yellow
    Pop-Location
    exit 1
}
Write-Host ""

# 5. Volver a la carpeta raiz
Write-Host "5. Limpiando..." -ForegroundColor Yellow
Pop-Location
Write-Host "OK - De vuelta en: $(Get-Location)" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "MIGRATIONS COMPLETADAS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "SIGUIENTES PASOS:" -ForegroundColor Cyan
Write-Host "   1. Configurar GitHub Secrets" -ForegroundColor Yellow
Write-Host "   2. Hacer push del codigo" -ForegroundColor Yellow
Write-Host ""
