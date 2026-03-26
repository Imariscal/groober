#!/bin/bash
# Script para ejecutar el seed de EHR Permissions

set -e

echo "🚀 Iniciando seed de permisos EHR..."
echo ""

cd "$(dirname "$0")"

# Ejecutar el seed usando ts-node
npx ts-node -O '{"module":"commonjs"}' src/database/seeds/seed-ehr-permissions.ts

echo ""
echo "✅ Seed completado!"
