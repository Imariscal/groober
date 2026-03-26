# ============================================================
# VibraLive Beta - Azure Deploy Script
# Para: ea092bf5-9971-4502-b997-37ec136aeb2d
# ============================================================

# VARIABLES
$subscriptionId = "ea092bf5-9971-4502-b997-37ec136aeb2d"
$resourceGroup = "vibralive-beta-rg"
$location = "westeurope"
$environment = "beta"
$prefix = "vibralive"
$dbAdmin = "vibralive_admin"
$dbPassword = -join ((33..126) | Get-Random -Count 32 | % {[char]$_})
$dbName = "vibralive_beta"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VibraLive Beta - Azure Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "1. Conectando a Azure..." -ForegroundColor Yellow
az login
az account set --subscription $subscriptionId
Write-Host "OK - Conectado" -ForegroundColor Green
Write-Host ""

# 2. Resource Group
Write-Host "2. Creando Resource Group..." -ForegroundColor Yellow
az group create --name $resourceGroup --location $location
Write-Host "OK - Resource Group creado" -ForegroundColor Green
Write-Host ""

# 3. App Service Plan
Write-Host "3. Creando App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
  --name "$prefix-beta-plan" `
  --resource-group $resourceGroup `
  --sku B1 `
  --is-linux
Write-Host "OK - App Service Plan creado" -ForegroundColor Green
Write-Host ""

# 4. App Service Backend
Write-Host "4. Creando App Service (Backend)..." -ForegroundColor Yellow
az webapp create `
  --resource-group $resourceGroup `
  --plan "$prefix-beta-plan" `
  --name "$prefix-api-beta" `
  --runtime "node|20-lts"
Write-Host "OK - App Service creado" -ForegroundColor Green
Write-Host ""

# 5. PostgreSQL Server
Write-Host "5. Creando PostgreSQL Server..." -ForegroundColor Yellow
az postgres flexible-server create `
  --resource-group $resourceGroup `
  --name "$prefix-db-beta" `
  --location $location `
  --admin-user $dbAdmin `
  --admin-password "$dbPassword" `
  --sku-name "Standard_B1ms" `
  --tier "Burstable" `
  --storage-size 51200 `
  --backup-retention 7
Write-Host "OK - PostgreSQL Server creado" -ForegroundColor Green
Write-Host ""

# 6. Base de datos
Write-Host "6. Creando base de datos..." -ForegroundColor Yellow
az postgres flexible-server db create `
  --resource-group $resourceGroup `
  --server-name "$prefix-db-beta" `
  --database-name $dbName
Write-Host "OK - Base de datos creada" -ForegroundColor Green
Write-Host ""

# 7. Static Web App
Write-Host "7. Creando Static Web App (Frontend)..." -ForegroundColor Yellow
$staticResult = az staticwebapp create `
  --name "$prefix-web-beta" `
  --resource-group $resourceGroup `
  --source https://github.com/TU_USERNAME/vibralive-frontend `
  --branch main `
  --app-location "vibralive-frontend" `
  --output-location ".next" `
  --location $location `
  -o json | ConvertFrom-Json
$staticUrl = $staticResult.url
Write-Host "OK - Static Web App creada" -ForegroundColor Green
Write-Host ""

# 8. Container Registry
Write-Host "8. Creando Container Registry..." -ForegroundColor Yellow
$registryName = "vibralivereg$(Get-Random -Minimum 1000 -Maximum 9999)"
az acr create `
  --resource-group $resourceGroup `
  --name $registryName `
  --sku Basic
Write-Host "OK - Container Registry creado" -ForegroundColor Green
Write-Host ""

# 9. Guardar credenciales
Write-Host "9. Guardando credenciales..." -ForegroundColor Yellow

$apiUrl = "https://$prefix-api-beta.azurewebsites.net"
$dbHost = "$prefix-db-beta.postgres.database.azure.com"
$dbConnString = "postgresql://${dbAdmin}:${dbPassword}@${dbHost}:5432/${dbName}?sslmode=require"

$credentials = @"
# VIBRALIVE BETA - CREDENCIALES AZURE
# Generado: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# GUARDAR EN PASSWORD MANAGER

AZURE_SUBSCRIPTION_ID=$subscriptionId
AZURE_RESOURCE_GROUP=$resourceGroup

API_URL=$apiUrl
AZURE_BACKEND_NAME=$prefix-api-beta

DATABASE_HOST=$dbHost
DATABASE_PORT=5432
DATABASE_USER=$dbAdmin
DATABASE_PASSWORD=$dbPassword
DATABASE_NAME=$dbName
DATABASE_CONNECTION_STRING=$dbConnString

FRONTEND_URL=$staticUrl
AZURE_FRONTEND_NAME=$prefix-web-beta

REGISTRY_NAME=$registryName
REGISTRY_URL=$registryName.azurecr.io

ENVIRONMENT=$environment
"@

$credentials | Out-File -FilePath "AZURE_CREDENTIALS_BETA.env" -Encoding UTF8 -Force
Write-Host "OK - Credenciales guardadas" -ForegroundColor Green
Write-Host ""

# 10. Mostrar resumen
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOY COMPLETADO - BETA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "BACKEND API:" -ForegroundColor Cyan
Write-Host "   URL: $apiUrl" -ForegroundColor Yellow
Write-Host "   App Service: $prefix-api-beta" -ForegroundColor Yellow
Write-Host ""

Write-Host "FRONTEND:" -ForegroundColor Cyan
Write-Host "   URL: $staticUrl" -ForegroundColor Yellow
Write-Host "   Static Web App: $prefix-web-beta" -ForegroundColor Yellow
Write-Host ""

Write-Host "DATABASE:" -ForegroundColor Cyan
Write-Host "   Server: $dbHost" -ForegroundColor Yellow
Write-Host "   User: $dbAdmin" -ForegroundColor Yellow
Write-Host "   Database: $dbName" -ForegroundColor Yellow
Write-Host ""

Write-Host "CONTAINER REGISTRY:" -ForegroundColor Cyan
Write-Host "   Registry: $registryName.azurecr.io" -ForegroundColor Yellow
Write-Host ""

Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "   1. Credenciales guardadas en: AZURE_CREDENTIALS_BETA.env" -ForegroundColor Yellow
Write-Host "   2. GUARDAR EN PASSWORD MANAGER (1Password, Bitwarden, etc)" -ForegroundColor Red
Write-Host "   3. NO COMMITEAR A GIT" -ForegroundColor Red
Write-Host "   4. Agregar a .gitignore: AZURE_CREDENTIALS_BETA.env" -ForegroundColor Red
Write-Host ""

Write-Host "SIGUIENTES PASOS:" -ForegroundColor Cyan
Write-Host "   1. Copiar valores del archivo .env al App Service" -ForegroundColor Yellow
Write-Host "   2. Configurar GitHub Secrets para CI/CD" -ForegroundColor Yellow
Write-Host "   3. Ejecutar migrations de BD" -ForegroundColor Yellow
Write-Host "   4. Deploy del codigo" -ForegroundColor Yellow
Write-Host ""
