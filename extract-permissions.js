#!/usr/bin/env node

/**
 * Extrae todos los permisos únicos de roles-permissions.const.ts
 * Uso: node extract-permissions.js
 */

const fs = require('fs');
const path = require('path');

// Leer el archivo const.ts
const constPath = path.join(__dirname, 'vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts');
const constContent = fs.readFileSync(constPath, 'utf-8');

// Extraer todos los keys de permisos regex
const permissionRegex = /{\s*key:\s*'([^']+)',\s*description:/g;
const matches = [];
let match;

while ((match = permissionRegex.exec(constContent)) !== null) {
  matches.push(match[1]);
}

// Obtener permisos únicos
const uniquePermissions = [...new Set(matches)];

// Agrupar por categoría (prefijo antes del primer :)
const permissionsByCategory = {};
uniquePermissions.forEach(perm => {
  const category = perm.split(':')[0];
  if (!permissionsByCategory[category]) {
    permissionsByCategory[category] = [];
  }
  permissionsByCategory[category].push(perm);
});

// Ordenar categorías por cantidad de permisos descendente
const sortedCategories = Object.keys(permissionsByCategory).sort(
  (a, b) => permissionsByCategory[b].length - permissionsByCategory[a].length
);

// Generar reporte
console.log('\n' + '='.repeat(80));
console.log('📊 REPORTE DE PERMISOS - VibraLive');
console.log('='.repeat(80) + '\n');

console.log('🔐 RESUMEN GENERAL:');
console.log(`   Total de permisos ÚNICOS: ${uniquePermissions.length}`);
console.log(`   Categorías: ${Object.keys(permissionsByCategory).length}\n`);

console.log('📋 DESGLOSE POR CATEGORÍA:\n');

let totalCount = 0;
sortedCategories.forEach(category => {
  const perms = permissionsByCategory[category];
  const count = perms.length;
  totalCount += count;
  
  console.log(`${category.toUpperCase()}: ${count} permisos`);
  console.log('-'.repeat(80));
  
  perms.sort().forEach(perm => {
    console.log(`  ✓ ${perm}`);
  });
  console.log('');
});

console.log('='.repeat(80));
console.log(`TOTAL ÚNICO (sin repeticiones): ${uniquePermissions.length} permisos`);
console.log('='.repeat(80) + '\n');

// Generar tabla de categorías
console.log('📊 TABLA RESUMIDA:\n');
console.log('┌─────────────────────────────────┬──────────┐');
console.log('│ Categoría                       │ Permisos │');
console.log('├─────────────────────────────────┼──────────┤');

sortedCategories.forEach(category => {
  const count = permissionsByCategory[category].length;
  const padding = 31 - category.length;
  console.log(`│ ${category}${' '.repeat(padding)} │   ${count.toString().padStart(2, ' ')}   │`);
});

console.log('├─────────────────────────────────┼──────────┤');
console.log(`│ TOTAL                           │  ${uniquePermissions.length.toString().padStart(3, ' ')}   │`);
console.log('└─────────────────────────────────┴──────────┘\n');

// Detectar permisos con patrón ehr:
const ehrPerms = uniquePermissions.filter(p => p.startsWith('ehr:'));
console.log(`⭐ Permisos EHR (ehr:*): ${ehrPerms.length}\n`);

console.log('\n✅ Análisis completado.\n');
