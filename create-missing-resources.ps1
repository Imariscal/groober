# ============================================================
# Groober Beta - Crear recursos faltantes en Azure
# ============================================================

$resourceGroup = "groober-beta-rg"
$location = "westeurope"
$dbPassword = ">369O,{C|hy0KBWcu&vl`4znk.tY7gp!"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Crear Recursos Faltantes - Groober Beta" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. App Service Backend
Write-Host "1. Creando App Service (Backend)..." -ForegroundColor Yellow
try {
    az webapp create `
      --resource-group $resourceGroup `
      --plan groober-beta-plan `
      --name groober-api-beta `
      --runtime "node|20-lts"
    Write-Host "OK - App Service creado" -ForegroundColor Green
} catch {
    Write-Host "ERROR - App Service: $_" -ForegroundColor Red
}
Write-Host ""

# 2. PostgreSQL Server
Write-Host "2. Creando PostgreSQL Server..." -ForegroundColor Yellow
Write-Host "   (Esto tarda 10-15 minutos, por favor espera...)" -ForegroundColor Gray
try {
    az postgres flexible-server create `
      --resource-group $resourceGroup `
      --name groober-db-beta `
      --location $location `
      --admin-user groober_admin `
      --admin-password $dbPassword `
      --sku-name "Standard_B1ms" `
      --tier "Burstable" `
      --storage-size 51200 `
      --backup-retention 7
    Write-Host "OK - PostgreSQL Server creado" -ForegroundColor Green
} catch {
    Write-Host "ERROR - PostgreSQL: $_" -ForegroundColor Red
}
Write-Host ""

# 3. Crear BD
Write-Host "3. Creando base de datos..." -ForegroundColor Yellow
try {
    az postgres flexible-server db create `
      --resource-group $resourceGroup `
      --server-name groober-db-beta `
      --database-name groober_beta
    Write-Host "OK - Base de datos creada" -ForegroundColor Green
} catch {
    Write-Host "ERROR - Base de datos: $_" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar
Write-Host "4. Verificando recursos..." -ForegroundColor Yellow
Write-Host ""
az resource list --resource-group $resourceGroup --output table
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "RECURSOS CREADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "SIGUIENTES PASOS:" -ForegroundColor Cyan
Write-Host "   1. Configurar App Service settings" -ForegroundColor Yellow
Write-Host "   2. Ejecutar database migrations" -ForegroundColor Yellow
Write-Host "   3. Configurar GitHub Secrets" -ForegroundColor Yellow
Write-Host ""
