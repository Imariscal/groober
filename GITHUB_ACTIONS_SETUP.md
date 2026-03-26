# VibraLive Beta - Configuración de GitHub Actions

## Configuración Requerida

### 1. Crear Secrets en GitHub

Ve a: **GitHub Repo → Settings → Secrets and variables → Actions**

Crea los siguientes secrets:

#### `AZURE_CREDENTIALS`
```json
{
  "clientId": "AQUI_CLIENT_ID",
  "clientSecret": "AQUI_CLIENT_SECRET",
  "subscriptionId": "ea092bf5-9971-4502-b997-37ec136aeb2d",
  "tenantId": "AQUI_TENANT_ID"
}
```

**Cómo obtenerlo:**
```bash
az ad sp create-for-rbac --name "vibralive-beta-ci" --role contributor \
  --scopes /subscriptions/ea092bf5-9971-4502-b997-37ec136aeb2d
```

#### `AZURE_STATIC_WEB_APPS_API_TOKEN_BETA`
- Ve a Azure Portal → Static Web Apps → vibralive-web-beta
- Manage deployment tokens → Copy token

#### Credenciales de Base de Datos
```
DATABASE_HOST: vibralive-db-beta.postgres.database.azure.com
DATABASE_PORT: 5432
DATABASE_USER: vibralive_admin
DATABASE_PASSWORD: (tu contraseña del deploy)
DATABASE_NAME: vibralive_beta
```

### 2. Configurar CORS en Backend

El backend necesita permitir que el frontend acceda:

**vibralive-backend/src/main.ts**
```typescript
app.enableCors({
  origin: [
    'https://vibralive-web-beta.azurestaticapps.net',
    'http://localhost:3000', // Para desarrollo local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 3. Verificar Workflow

- Cada push a `main` ejecuta el workflow automáticamente
- Ve a: **GitHub Repo → Actions** para ver el progreso
- Logs detallados disponibles para debugging

### 4. Monitorear Deploy

```bash
# Ver logs del App Service
az webapp log tail --resource-group vibralive-beta-rg --name vibralive-api-beta

# Ver logs del Frontend
az staticwebapp logs --resource-group vibralive-beta-rg --name vibralive-web-beta
```

---

## Troubleshooting CI/CD

### Si falla el deploy:

1. **Revisa los Secrets** - ¿Están correct?
2. **Verifica las credenciales de Azure** - ¿El Service Principal tiene permisos?
3. **Mira los logs** - GitHub Actions muestra errores detallados
4. **Base de datos** - ¿Las migrations se ejecutaron?
5. **CORS** - ¿El backend permite requests del frontend?

### Comando para resetear credenciales:

```bash
az account clear
az login
az account set --subscription ea092bf5-9971-4502-b997-37ec136aeb2d
```
