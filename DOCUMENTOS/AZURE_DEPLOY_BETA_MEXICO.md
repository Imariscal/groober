# VibraLive Beta - Deploy Azure México

**SCOPE:** 50 clínicas máx, 1-6 meses, Región México

---

## 🎯 Arquitectura Beta Optimizada (Costo: ~$40-50/mes)

### Diagrama
```
┌─────────────────────────────────────────────────────────────┐
│                    MÉXICO (West Europe)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Next.js)              Backend (NestJS)            │
│  Static Web Apps               App Service B1 (Básico)       │
│  $0-5/mes                       $20-30/mes                    │
│  (Global CDN)                   (1 vCPU, 1.75GB RAM)         │
│       ↓                              ↓                        │
│  ╔════════════════────────────────════════════╗              │
│  ║         Azure Application Gateway          ║              │
│  ║  (SSL, load balancing, CORS)               ║              │
│  ║  $15-20/mes                                ║              │
│  ╚════════════════════════════════════════════╝              │
│       ↓                              ↓                        │
│  ┌────────────────────────────────────────────┐              │
│  │     PostgreSQL Single Node (B-series)      │              │
│  │     $15-20/mes                             │              │
│  │     2 vCores, 4GB RAM, 50GB storage        │              │
│  └────────────────────────────────────────────┘              │
│       ↓                                                       │
│  ┌────────────────────────────────────────────┐              │
│  │  Route Optimizer (Container Instances)     │              │
│  │  $5-10/mes (runs on-demand, no 24/7)       │              │
│  └────────────────────────────────────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘

TOTAL MENSUAL: ~$55-85/mes
```

### Por qué esta arquitectura

| Componente | Por qué | Costo |
|-----------|--------|-------|
| **Static Web Apps** | Próximo.js optimizado, CDN global, SSL gratis | $0-5 |
| **App Service B1** | Perfecto para beta, escala fácil sin downtime | $20-30 |
| **PostgreSQL Single** | Sin redundancia (no necesaria en beta), respaldos automáticos | $15-20 |
| **App Gateway** | SSL termination, CORS centralizado, futuro load balancing | $15-20 |
| **Container Instances** | Paga solo cuando Route Optimizer se ejecuta | $5-10 |
| **Storage Account** | Para CDN/backups (10GB gratis) | $0 |

---

## 📋 PASO 1: Información de Suscripción Azure

**Necesito que me proporciones:**

```
1. ID de Suscripción Azure: ________________________
   (Settings → Subscriptions en Azure Portal)

2. Nombre: ________________________
   (ej: "VibraLive Beta")

3. Grupo de Recursos existente: ________________________
   (O creo uno nuevo? Nombre recomendado: "vibralive-beta-rg")
```

**Mientras obtienes eso, estos son los recursos exactos que voy a crear:**

| # | Recurso | Nombre | Región |
|---|---------|--------|--------|
| 1 | Resource Group | `vibralive-beta-rg` | West Europe |
| 2 | App Service Plan | `vibralive-beta-plan` | B1 (Basic) |
| 3 | App Service (Backend) | `vibralive-api-beta` | Node.js 20 LTS |
| 4 | Static Web App (Frontend) | `vibralive-web-beta` | Static |
| 5 | PostgreSQL Server | `vibralive-db-beta` | Single, B-series |
| 6 | Application Gateway | `vibralive-gateway-beta` | WAF included |
| 7 | Container Registry | `vibralivereg` | Para guardar Docker images |
| 8 | Storage Account | `vibralivestore` | Para backups/CDN |

---

## 🚀 PASO 2: Script de Deployment Automático

Una vez tengas tu suscripción, copia este script en PowerShell:

```powershell
# ============================================================
# VibraLive Beta - Azure Deploy Script (México)
# ============================================================

# VARIABLES - CAMBIAR SEGÚN TU CONTEXTO
$subscriptionId = "TU_SUBSCRIPTION_ID_AQUI"
$resourceGroup = "vibralive-beta-rg"
$location = "westeurope"
$environment = "beta"

# Prefijo para nombres únicos (Azure requiere nombres globalmente únicos)
$prefix = "vibralive$(Get-Random -Minimum 1000 -Maximum 9999)"

# Credenciales BD
$dbAdmin = "vibralive_admin"
$dbPassword = "$(New-Guid)!@Xyz123" # Cambiar a algo más robusto en producción
$dbName = "vibralive_beta"

Write-Host "🚀 Iniciando Deploy VibraLive BETA en Azure México..." -ForegroundColor Cyan

# 1. Login a Azure
Write-Host "`n1️⃣ Conectando a Azure..." -ForegroundColor Yellow
az login
az account set --subscription $subscriptionId

# 2. Crear Resource Group
Write-Host "`n2️⃣ Creando Resource Group..." -ForegroundColor Yellow
az group create `
  --name $resourceGroup `
  --location $location

# 3. Crear App Service Plan (B1 - Básico)
Write-Host "`n3️⃣ Creando App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
  --name "$prefix-plan" `
  --resource-group $resourceGroup `
  --sku B1 `
  --is-linux

# 4. Crear App Service para Backend
Write-Host "`n4️⃣ Creando App Service (Backend)..." -ForegroundColor Yellow
az webapp create `
  --resource-group $resourceGroup `
  --plan "$prefix-plan" `
  --name "$prefix-api-beta" `
  --runtime "node|20-lts" `
  --deployment-type "code"

# 5. Crear PostgreSQL Database
Write-Host "`n5️⃣ Creando PostgreSQL Server..." -ForegroundColor Yellow
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

# 6. Crear BD en PostgreSQL
Write-Host "`n6️⃣ Creando base de datos..." -ForegroundColor Yellow
az postgres flexible-server db create `
  --resource-group $resourceGroup `
  --server-name "$prefix-db-beta" `
  --database-name $dbName

# 7. Crear Static Web App (Frontend)
Write-Host "`n7️⃣ Creando Static Web App (Frontend)..." -ForegroundColor Yellow
az staticwebapp create `
  --name "$prefix-web-beta" `
  --resource-group $resourceGroup `
  --source https://github.com/TU_USER/vibralive-frontend `
  --location $location `
  --branch main `
  --app-location "/" `
  --output-location ".next" `
  --token "GITHUB_TOKEN_AQUI"

# 8. Crear Container Registry (para Docker images)
Write-Host "`n8️⃣ Creando Container Registry..." -ForegroundColor Yellow
az acr create `
  --resource-group $resourceGroup `
  --name "$prefix" `
  --sku Basic

# 9. Mostrar credenciales
Write-Host "`n✅ DEPLOY COMPLETADO!" -ForegroundColor Green
Write-Host "`n📝 GUARDAR ESTOS DATOS:" -ForegroundColor Cyan

$apiUrl = "https://$prefix-api-beta.azurewebsites.net"
$dbConnString = "postgresql://${dbAdmin}:${dbPassword}@${prefix}-db-beta.postgres.database.azure.com:5432/${dbName}"

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║           🎉 CREDENTIALS & ENDPOINTS - BETA 🎉             ║
╚════════════════════════════════════════════════════════════╝

📍 BACKEND API:
   URL: $apiUrl
   App Service: $prefix-api-beta

🗄️  DATABASE:
   Server: $prefix-db-beta.postgres.database.azure.com
   User: $dbAdmin
   Password: $dbPassword
   Database: $dbName
   Connection String: $dbConnString

🌐 FRONTEND:
   URL: https://$prefix-web-beta.azurestaticapps.net
   Static Web App: $prefix-web-beta

🔐 CONTAINER REGISTRY:
   Registry: $prefix.azurecr.io
   Get credentials: az acr credential show --name $prefix

💾 GUARDAR EN ARCHIVO SEGURO (Password Manager):
   1. Contraseña DB: $dbPassword
   2. Static Web App token: GITHUB_TOKEN_AQUI
"@

# 10. Guardar credenciales en archivo local (SOLO PARA DESARROLLO)
$credentials = @{
    subscriptionId = $subscriptionId
    apiUrl = $apiUrl
    dbConnString = $dbConnString
    dbPassword = $dbPassword
    resourceGroup = $resourceGroup
    environment = $environment
}

$credentials | ConvertTo-Json | Out-File "./azure-credentials-beta.json" -Encoding UTF8
Write-Host "`n⚠️  Credenciales guardadas en: ./azure-credentials-beta.json" -ForegroundColor Yellow
Write-Host "   ⚠️  GUARDAR ESTE ARCHIVO EN LUGAR SEGURO (Password Manager)" -ForegroundColor Red
```

---

## 🔧 PASO 3: Configurar Variables de Entorno

### Backend (.env en App Service)

```bash
# Database
DATABASE_HOST=vibralive-db-beta.postgres.database.azure.com
DATABASE_PORT=5432
DATABASE_USER=vibralive_admin
DATABASE_PASSWORD=<CONTRASEÑA_DE_ARRIBA>
DATABASE_NAME=vibralive_beta
DATABASE_SSL=true

# Application
NODE_ENV=beta
API_PORT=3000
API_URL=https://<prefix>-api-beta.azurewebsites.net

# CORS - Solo frontend
CORS_ORIGIN=https://<prefix>-web-beta.azurestaticapps.net

# JWT Secrets
JWT_SECRET=<GENERAR_UNO_NUEVO_FUERTE>
JWT_EXPIRATION=24h

# Route Optimizer
ROUTE_OPTIMIZER_URL=https://<prefix>-route-opt.northeurope.azurecontainer.io:8001

# Logging
LOG_LEVEL=info
SENTRY_DSN=<OPCIONAL_PARA_ERRORES>
```

### Frontend (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiBackend = process.env.API_BACKEND_URL || 
      'https://vibralive-api-beta.azurewebsites.net';
    
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${apiBackend}/api/:path*`,
        },
      ],
    };
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.azurewebsites.net',
      },
    ],
  },
};

module.exports = nextConfig;
```

### Frontend (.env.local para azurestaticapps.net)

```env
# IMPORTANTE: NO poner API_URL aquí, está en next.config.js
NEXT_PUBLIC_APP_NAME=VibraLive Beta
NEXT_PUBLIC_MAPS_PROVIDER=leaflet
NEXT_PUBLIC_MAPS_ENABLED=true
```

---

## 🐳 PASO 4: Dockerfiles para Azure

### Backend Dockerfile

```dockerfile
# BUILD STAGE
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# PRODUCTION STAGE
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=beta

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=beta
ENV NEXT_PUBLIC_APP_NAME="VibraLive Beta"

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

EXPOSE 3000

CMD ["npm", "run", "start"]
```

---

## 💾 PASO 5: Backup & Disaster Recovery

### Backup automático PostgreSQL
```bash
# Azure lo hace por defecto: 7 días de retención
# Para restaurar:
az postgres flexible-server restore \
  --resource-group vibralive-beta-rg \
  --name vibralive-db-backup \
  --source-server vibralive-db-beta \
  --restore-time 2026-03-25T10:00:00Z
```

### Backup del código (GitHub)
```bash
# Asegúrate que GitHub Actions está habilitado
# En repo: Settings → Actions → Runner groups
```

---

## 🏗️ CI/CD AUTOMÁTICO (GitHub → Azure)

Crear archivo `.github/workflows/deploy-azure-beta.yml`:

```yaml
name: Deploy VibraLive Beta to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_RESOURCEGROUP: vibralive-beta-rg
  AZURE_APPSERVICE_BACKEND: vibralive-api-beta
  AZURE_APPSERVICE_FRONTEND: vibralive-web-beta
  NODE_VERSION: '20'

jobs:
  build-backend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
    
    - name: Install dependencies (Backend)
      run: cd vibralive-backend && npm ci
    
    - name: Build Backend
      run: cd vibralive-backend && npm run build
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Deploy Backend to App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_APPSERVICE_BACKEND }}
        package: vibralive-backend/dist
        
  build-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
    
    - name: Install dependencies (Frontend)
      run: cd vibralive-frontend && npm ci
    
    - name: Build Frontend
      run: cd vibralive-frontend && npm run build
    
    - name: Deploy to Static Web App
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_BETA }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: upload
        app_location: vibralive-frontend
        output_location: .next
```

---

## 📊 COSTOS ESTIMADOS (México - 6 meses Beta)

| Mes | Recurso | Costo |
|-----|---------|-------|
| 1-3 | App Service B1 | $25 |
| 1-3 | PostgreSQL B-series | $17 |
| 1-3 | Application Gateway | $18 |
| 1-3 | Container Registry | $5 |
| 1-3 | **Subtotal/mes** | **~$65** |
| 1-6 | **Total 6 meses** | **~$390** |

**Nota:** Si usa 50 clínicas activas, podría subir a $80-90/mes, pero sigue siendo muy económico.

---

## ⚠️ LIMITACIONES BETA (Aceptables para 50 clínicas)

| Limitación | Impacto | Solución en Producción |
|-----------|--------|----------------------|
| **B1 App Service** | ~500-1000 reqs/seg | Escalar a S1/S2 |
| **Sin Load Balancer** | Mantenimiento = downtime 5min | Application Gateway con slots |
| **PostgreSQL Single Node** | Sin redundancia | Geo-replication |
| **Sin CDN** | Latencia fuera México | Azure CDN o Cloudflare |
| **Sin Auto-scaling** | Tráfico pico = lentitud | App Service auto-scale rules |

---

## 🎯 PRÓXIMOS PASOS

1. **Dame tu Subscription ID**
   ```
   Azure Portal → Subscriptions → Copy Subscription ID
   ```

2. **Ejecuta el script PowerShell**
   ```powershell
   # Copia el script de arriba
   # Cambia $subscriptionId por tu Subscription ID
   # Ejecuta en PowerShell con Azure CLI instalado
   .\deploy-beta.ps1
   ```

3. **Configura las variables de entorno** en App Service
   - Backend .env variables
   - Frontend next.config.js

4. **Sube el código a GitHub**
   ```bash
   git push origin main # Dispara CI/CD automático
   ```

5. **Testea en producción**
   - Verifica que frontend carga
   - Prueba login
   - Verifica rutas de API

---

## 🆘 TROUBLESHOOTING RÁPIDO

Si algo falla:

```bash
# Ver logs del App Service (Backend)
az webapp log tail --resource-group vibralive-beta-rg --name vibralive-api-beta

# Ver logs de BD
az postgres flexible-server server-logs list --name vibralive-db-beta --resource-group vibralive-beta-rg

# Verificar CORS
curl -i -H "Origin: https://vibralive-web-beta.azurestaticapps.net" \
  https://vibralive-api-beta.azurewebsites.net/api/health
```

---

**¿Listos? Dame tu Subscription ID y empezamos el deploy.** 🚀

