# ============================================================
# VibraLive Beta - Azure Deploy Script (México)
# PowerShell Version - Para Windows
# Subscription: ea092bf5-9971-4502-b997-37ec136aeb2d
# ============================================================

param(
    [string]$Action = "deploy"
)

# VARIABLES
$subscriptionId = "ea092bf5-9971-4502-b997-37ec136aeb2d"
$resourceGroup = "vibralive-beta-rg"
$location = "westeurope"
$environment = "beta"
$prefix = "vibralive"

# Credenciales BD
$dbAdmin = "vibralive_admin"
$dbPassword = -join ((33..126) | Get-Random -Count 32 | % {[char]$_})
$dbName = "vibralive_beta"

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "🚀 VibraLive Beta - Azure Deploy (México)"
Write-Info "Subscription: $subscriptionId`n"

# 1. Login a Azure
Write-Warning "1️⃣ Conectando a Azure..."
az login
az account set --subscription $subscriptionId
Write-Success "✓ Conectado`n"

# 2. Crear Resource Group
Write-Warning "2️⃣ Creando Resource Group: $resourceGroup"
az group create `
  --name $resourceGroup `
  --location $location
Write-Success "[OK] Resource Group creado`n"

# 3. Crear App Service Plan (B1)
Write-Warning "3️⃣ Creando App Service Plan (B1)..."
az appservice plan create `
  --name "$prefix-beta-plan" `
  --resource-group $resourceGroup `
  --sku B1 `
  --is-linux
Write-Success "[OK] App Service Plan creado`n"

# 4. Crear App Service para Backend
Write-Warning "4️⃣ Creando App Service (Backend)..."
az webapp create `
  --resource-group $resourceGroup `
  --plan "$prefix-beta-plan" `
  --name "$prefix-api-beta" `
  --runtime "node`|20-lts"
Write-Success "[OK] App Service creado`n"

# 5. Crear PostgreSQL Server
Write-Warning "5️⃣ Creando PostgreSQL Server..."
az postgres flexible-server create `
  --resource-group $resourceGroup `
  --name "$prefix-db-beta" `
  --location $location `
  --admin-user $dbAdmin `
  --admin-password $dbPassword `
  --sku-name "Standard_B1ms" `
  --tier "Burstable" `
  --storage-size 51200 `
  --backup-retention 7
Write-Success "[OK] PostgreSQL Server creado`n"

# 6. Crear BD
Write-Warning "6️⃣ Creando base de datos..."
az postgres flexible-server db create `
  --resource-group $resourceGroup `
  --server-name "$prefix-db-beta" `
  --database-name $dbName
Write-Success "[OK] Base de datos creada`n"

# 7. Crear Static Web App (Frontend)
Write-Warning "7️⃣ Creando Static Web App (Frontend)..."
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
Write-Success "[OK] Static Web App creada`n"

# 8. Crear Container Registry
Write-Warning "8️⃣ Creando Container Registry..."
$registryName = "vibralivereg$(Get-Random -Minimum 1000 -Maximum 9999)"
az acr create `
  --resource-group $resourceGroup `
  --name $registryName `
  --sku Basic
Write-Success "[OK] Container Registry creado`n"

# 9. Guardar credenciales
Write-Warning "9️⃣ Guardando credenciales..."

$apiUrl = "https://$prefix-api-beta.azurewebsites.net"
$dbHost = "$prefix-db-beta.postgres.database.azure.com"
$dbConnString = "postgresql://${dbAdmin}:${dbPassword}@${dbHost}:5432/${dbName}?sslmode=require"

$credentials = @"
# ============================================================
# VIBRALIVE BETA - CREDENCIALES AZURE
# Generado: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# ⚠️  GUARDAR EN PASSWORD MANAGER
# ============================================================

# Subscription
AZURE_SUBSCRIPTION_ID=$subscriptionId
AZURE_RESOURCE_GROUP=$resourceGroup

# Backend API
API_URL=$apiUrl
AZURE_BACKEND_NAME=$prefix-api-beta

# Database
DATABASE_HOST=$dbHost
DATABASE_PORT=5432
DATABASE_USER=$dbAdmin
DATABASE_PASSWORD=$dbPassword
DATABASE_NAME=$dbName
DATABASE_CONNECTION_STRING=$dbConnString

# Frontend
FRONTEND_URL=$staticUrl
AZURE_FRONTEND_NAME=$prefix-web-beta

# Container Registry
REGISTRY_NAME=$registryName
REGISTRY_URL=$registryName.azurecr.io

# Environment
ENVIRONMENT=$environment
"@

$credentials | Out-File -FilePath "./AZURE_CREDENTIALS_BETA.env" -Encoding UTF8
Write-Success "[OK] Credenciales guardadas`n"

# 10. Mostrar resumen
Write-Info "╔════════════════════════════════════════════════════════════╗"
Write-Info "║           DEPLOY COMPLETADO - BETA                         ║"
Write-Info "╚════════════════════════════════════════════════════════════╝`n"

Write-Success "📍 BACKEND API:"
Write-Info "   URL: $apiUrl"
Write-Info "   App Service: $prefix-api-beta`n"

Write-Success "🌐 FRONTEND:"
Write-Info "   URL: $staticUrl"
Write-Info "   Static Web App: $prefix-web-beta`n"

Write-Success "🗄️  DATABASE:"
Write-Info "   Server: $dbHost"
Write-Info "   User: $dbAdmin"
Write-Info "   Database: $dbName`n"

Write-Success "🔐 CONTAINER REGISTRY:"
Write-Info "   Registry: $registryName.azurecr.io`n"

Write-Error "WARNING - IMPORTANT:"
Write-Info "   1. Credenciales guardadas en: AZURE_CREDENTIALS_BETA.env"
Write-Error "   2. GUARDAR ESTE ARCHIVO EN PASSWORD MANAGER (1Password, Bitwarden)"
Write-Error "   3. NO COMMITEAR A GIT"
Write-Error "   4. Agregar a .gitignore: AZURE_CREDENTIALS_BETA.env`n"

Write-Info "SIGUIENTES PASOS:"
Write-Info "   1. Copiar valores del archivo .env al App Service"
Write-Info "   2. Configurar GitHub Secrets para CI/CD"
Write-Info "   3. Ejecutar migrations de BD"
Write-Info "   4. Deploy del código`n"
