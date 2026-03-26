# ============================================================
# Groober Beta - Crear recursos faltantes (FIXED)
# ============================================================

$resourceGroup = "groober-beta-rg"
$location = "westeurope"
$planName = "groober-beta-plan"

# Password escapeado correctamente
$dbPassword = @">369O,{C|hy0KBWcu&vl`4znk.tY7gp!"@

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Crear Recursos Faltantes - Groober Beta" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. App Service Backend
Write-Host "1. Creando App Service (Backend)..." -ForegroundColor Yellow
$appServiceCmd = @"
az webapp create `
  --resource-group $resourceGroup `
  --plan $planName `
  --name groober-api-beta `
  --runtime "node|20-lts"
"@

Invoke-Expression $appServiceCmd
Write-Host "OK - App Service creado" -ForegroundColor Green
Write-Host ""

# 2. PostgreSQL Server
Write-Host "2. Creando PostgreSQL Server..." -ForegroundColor Yellow
Write-Host "   (Esto tarda 10-15 minutos, espera...)" -ForegroundColor Gray

$postgresCmd = @"
az postgres flexible-server create `
  --resource-group $resourceGroup `
  --name groober-db-beta `
  --location $location `
  --admin-user groober_admin `
  --admin-password "$dbPassword" `
  --sku-name "Standard_B1ms" `
  --tier "Burstable" `
  --storage-size 51200 `
  --backup-retention 7 `
  --version 15
"@

Invoke-Expression $postgresCmd
Write-Host "OK - PostgreSQL Server creado" -ForegroundColor Green
Write-Host ""

# 3. Crear BD
Write-Host "3. Creando base de datos..." -ForegroundColor Yellow

$dbCmd = @"
az postgres flexible-server db create `
  --resource-group $resourceGroup `
  --server-name groober-db-beta `
  --database-name groober_beta
"@

Invoke-Expression $dbCmd
Write-Host "OK - Base de datos creada" -ForegroundColor Green
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
