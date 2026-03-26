# ============================================================
# Groober Beta - Configurar App Service Settings
# ============================================================

# VARIABLES (COPIA DEL ARCHIVO DE CREDENCIALES)
$resourceGroup = "groober-beta-rg"
$appServiceName = "groober-api-beta"
$subscriptionId = "ea092bf5-9971-4502-b997-37ec136aeb2d"

# Credenciales - Reemplaza estos valores
$databaseHost = "groober-db-beta.postgres.database.azure.com"
$databasePort = "5432"
$databaseUser = "groober_admin"
$databasePassword = ">369O,{C|hy0KBWcu&vl`4znk.tY7gp!"  # Ya con escape correcto
$databaseName = "groober_beta"
$corsOrigin = "https://groober-web-beta.azurestaticapps.net"
$jwtSecret = "$(New-Guid)"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando App Service - Groober Beta" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Conectando a Azure..." -ForegroundColor Yellow
az account set --subscription $subscriptionId
Write-Host "OK" -ForegroundColor Green
Write-Host ""

Write-Host "2. Configurando variables de entorno..." -ForegroundColor Yellow
Write-Host "   (Esto toma 1-2 minutos)" -ForegroundColor Gray
Write-Host ""

# Usar @ para array literal para evitar problemas con caracteres especiales
$settings = @(
    "DATABASE_HOST=$databaseHost",
    "DATABASE_PORT=$databasePort",
    "DATABASE_USER=$databaseUser",
    "DATABASE_PASSWORD=$databasePassword",
    "DATABASE_NAME=$databaseName",
    "NODE_ENV=beta",
    "CORS_ORIGIN=$corsOrigin",
    "API_PORT=3000",
    "JWT_SECRET=$jwtSecret"
)

az webapp config appsettings set `
  --resource-group $resourceGroup `
  --name $appServiceName `
  --settings $settings

Write-Host ""
Write-Host "OK - Variables configuradas" -ForegroundColor Green
Write-Host ""

Write-Host "3. Verificando configuracion..." -ForegroundColor Yellow
az webapp config appsettings list `
  --resource-group $resourceGroup `
  --name $appServiceName `
  --output table | Select-Object -Property Name, Value

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "SIGUIENTES PASOS:" -ForegroundColor Cyan
Write-Host "   1. Ejecutar migrations de BD" -ForegroundColor Yellow
Write-Host "   2. Configurar GitHub Secrets" -ForegroundColor Yellow
Write-Host "   3. Hacer push del codigo" -ForegroundColor Yellow
Write-Host ""
