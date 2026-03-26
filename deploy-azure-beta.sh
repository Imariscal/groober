#!/bin/bash
# ============================================================
# VibraLive Beta - Azure Deploy Script (México)
# Personalizado para: ea092bf5-9971-4502-b997-37ec136aeb2d
# ============================================================

set -e

# VARIABLES
SUBSCRIPTION_ID="ea092bf5-9971-4502-b997-37ec136aeb2d"
RESOURCE_GROUP="vibralive-beta-rg"
LOCATION="westeurope"
ENVIRONMENT="beta"
REGISTRY_NAME="vibralivereg$(date +%s | tail -c 5)"  # Nombre único
PREFIX="vibralive"

# Credenciales BD (CAMBIAR EN PRODUCCIÓN)
DB_ADMIN="vibralive_admin"
DB_PASSWORD="$(openssl rand -base64 32)"
DB_NAME="vibralive_beta"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 VibraLive Beta - Azure Deploy (México)${NC}"
echo -e "${CYAN}Subscription: $SUBSCRIPTION_ID${NC}\n"

# 1. Login a Azure
echo -e "${YELLOW}1️⃣ Conectando a Azure...${NC}"
az login
az account set --subscription $SUBSCRIPTION_ID
echo -e "${GREEN}✓ Conectado${NC}\n"

# 2. Crear Resource Group
echo -e "${YELLOW}2️⃣ Creando Resource Group: $RESOURCE_GROUP${NC}"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
echo -e "${GREEN}✓ Resource Group creado${NC}\n"

# 3. Crear App Service Plan (B1)
echo -e "${YELLOW}3️⃣ Creando App Service Plan (B1)...${NC}"
az appservice plan create \
  --name "$PREFIX-beta-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux
echo -e "${GREEN}✓ App Service Plan creado${NC}\n"

# 4. Crear App Service para Backend
echo -e "${YELLOW}4️⃣ Creando App Service (Backend)...${NC}"
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "$PREFIX-beta-plan" \
  --name "$PREFIX-api-beta" \
  --runtime "node|20-lts"
echo -e "${GREEN}✓ App Service creado${NC}\n"

# 5. Crear PostgreSQL Server
echo -e "${YELLOW}5️⃣ Creando PostgreSQL Server...${NC}"
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name "$PREFIX-db-beta" \
  --location $LOCATION \
  --admin-user $DB_ADMIN \
  --admin-password "$DB_PASSWORD" \
  --sku-name "Standard_B1ms" \
  --tier "Burstable" \
  --storage-size 51200 \
  --backup-retention 7 \
  --high-availability Disabled
echo -e "${GREEN}✓ PostgreSQL Server creado${NC}\n"

# 6. Crear BD
echo -e "${YELLOW}6️⃣ Creando base de datos...${NC}"
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name "$PREFIX-db-beta" \
  --database-name $DB_NAME
echo -e "${GREEN}✓ Base de datos creada${NC}\n"

# 7. Crear Static Web App (Frontend)
echo -e "${YELLOW}7️⃣ Creando Static Web App (Frontend)...${NC}"
STATIC_RESULT=$(az staticwebapp create \
  --name "$PREFIX-web-beta" \
  --resource-group $RESOURCE_GROUP \
  --source https://github.com/TU_USERNAME/vibralive-frontend \
  --branch main \
  --app-location "vibralive-frontend" \
  --output-location ".next" \
  --location $LOCATION \
  -o json)

STATIC_URL=$(echo $STATIC_RESULT | jq -r '.url')
echo -e "${GREEN}✓ Static Web App creada: $STATIC_URL${NC}\n"

# 8. Crear Container Registry
echo -e "${YELLOW}8️⃣ Creando Container Registry...${NC}"
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $REGISTRY_NAME \
  --sku Basic
echo -e "${GREEN}✓ Container Registry creado: $REGISTRY_NAME${NC}\n"

# 9. Guardar credenciales
echo -e "${YELLOW}9️⃣ Guardando credenciales...${NC}"

API_URL="https://$PREFIX-api-beta.azurewebsites.net"
DB_HOST="$PREFIX-db-beta.postgres.database.azure.com"
DB_CONN_STRING="postgresql://${DB_ADMIN}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

cat > ./AZURE_CREDENTIALS_BETA.env << EOF
# ============================================================
# VIBRALIVE BETA - CREDENCIALES AZURE
# Generado: $(date)
# ⚠️  GUARDAR EN PASSWORD MANAGER
# ============================================================

# Subscription
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_RESOURCE_GROUP=$RESOURCE_GROUP

# Backend API
API_URL=$API_URL
AZURE_BACKEND_NAME=$PREFIX-api-beta

# Database
DATABASE_HOST=$DB_HOST
DATABASE_PORT=5432
DATABASE_USER=$DB_ADMIN
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_NAME=$DB_NAME
DATABASE_CONNECTION_STRING=$DB_CONN_STRING

# Frontend
FRONTEND_URL=$STATIC_URL
AZURE_FRONTEND_NAME=$PREFIX-web-beta

# Container Registry
REGISTRY_NAME=$REGISTRY_NAME
REGISTRY_URL=$REGISTRY_NAME.azurecr.io

# Environment
ENVIRONMENT=$ENVIRONMENT
EOF

echo -e "${GREEN}✓ Credenciales guardadas en: AZURE_CREDENTIALS_BETA.env${NC}\n"

# 10. Mostrar resumen
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           🎉 DEPLOY COMPLETADO - BETA 🎉                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}📍 BACKEND API:${NC}"
echo -e "   URL: ${YELLOW}$API_URL${NC}"
echo -e "   App Service: ${YELLOW}$PREFIX-api-beta${NC}\n"

echo -e "${GREEN}🌐 FRONTEND:${NC}"
echo -e "   URL: ${YELLOW}$STATIC_URL${NC}"
echo -e "   Static Web App: ${YELLOW}$PREFIX-web-beta${NC}\n"

echo -e "${GREEN}🗄️  DATABASE:${NC}"
echo -e "   Server: ${YELLOW}$DB_HOST${NC}"
echo -e "   User: ${YELLOW}$DB_ADMIN${NC}"
echo -e "   Database: ${YELLOW}$DB_NAME${NC}\n"

echo -e "${GREEN}🔐 CONTAINER REGISTRY:${NC}"
echo -e "   Registry: ${YELLOW}$REGISTRY_NAME.azurecr.io${NC}\n"

echo -e "${RED}⚠️  IMPORTANTE:${NC}"
echo -e "   1. Credenciales guardadas en: ${YELLOW}AZURE_CREDENTIALS_BETA.env${NC}"
echo -e "   2. GUARDAR ESTE ARCHIVO EN PASSWORD MANAGER (1Password, Bitwarden, etc)${NC}"
echo -e "   3. NO COMMITEAR A GIT${NC}"
echo -e "   4. Agregar a .gitignore: ${YELLOW}AZURE_CREDENTIALS_BETA.env${NC}\n"

echo -e "${CYAN}📝 PRÓXIMOS PASOS:${NC}"
echo -e "   1. Copiar valores del archivo .env al App Service"
echo -e "   2. Configurar GitHub Secrets para CI/CD"
echo -e "   3. Ejecutar migrations de BD"
echo -e "   4. Deploy del código\n"
