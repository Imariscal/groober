#!/usr/bin/env node

/**
 * Timezone Issues Verification Script
 * 
 * Este script verifica que todos los archivos problemáticos hayan sido corregidos
 * Uso: node verify-timezone-fixes.js
 */

const fs = require('fs');
const path = require('path');

const FIXES_NEEDED = {
  // CRÍTICA
  'src/components/appointments/AssignStylistModal.tsx': {
    severity: 'CRÍTICA',
    issues: [
      { line: 157, pattern: /new Date\(appointment\.scheduled_at\)/, description: 'Falta utcToZonedTime' },
      { line: 288, pattern: /new Date\(appointment\.scheduled_at\)/, description: 'Falta utcToZonedTime' },
      { line: 292, pattern: /new Date\(new Date.*getTime\(\)/, description: 'Cálculo sin timezone' },
    ],
    mustHave: 'useClinicTimezone',
  },
  'src/components/appointments/CancelAppointmentModal.tsx': {
    severity: 'CRÍTICA',
    issues: [
      { line: 44, pattern: /const appointmentDate = new Date/, description: 'Sin utcToZonedTime' },
      { line: 45, pattern: /const now = new Date\(\)/, description: 'Sin timezone' },
      { line: 46, pattern: /const twoHoursAgo = new Date/, description: 'Sin timezone' },
    ],
    mustHave: 'useClinicTimezone',
  },
  'src/app/(protected)/clinic/grooming/page.tsx': {
    severity: 'CRÍTICA',
    issues: [
      { line: 52, pattern: /new Date\(\)/, description: 'useState sin timezone' },
      { line: 149, pattern: /currentDay = new Date\(rangeStart\)/, description: 'Sin conversión timezone' },
      { line: 395, pattern: /const utcNow = new Date\(\)/, description: 'Sin conversión timezone' },
    ],
    mustHave: 'useClinicTimezone',
  },
  
  // ALTA
  'src/components/configurations/StylistAvailabilityTab.tsx': {
    severity: 'ALTA',
    issues: [
      { line: 796, pattern: /new Date\(period\.start_date\)\.toLocaleDateString/, description: 'Sin timezone' },
      { line: 936, pattern: /new Date\(capacity\.date\)\.toLocaleDateString/, description: 'Sin timezone' },
    ],
    mustHave: 'clinicTimezone or formatInClinicTz',
  },
  
  // MEDIA
  'src/app/(protected)/clinic/services/page.tsx': {
    severity: 'MEDIA',
    issues: [
      { line: 81, pattern: /new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)/, description: 'Sort sin timezone' },
    ],
    mustHave: 'utcToZonedTime or similar',
  },
  'src/app/(protected)/clinic/price-lists/page.tsx': {
    severity: 'MEDIA',
    issues: [
      { line: 87, pattern: /new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)/, description: 'Sort sin timezone' },
    ],
    mustHave: 'utcToZonedTime or similar',
  },
  'src/components/pricing/PricingBreakdown.tsx': {
    severity: 'MEDIA',
    issues: [
      { line: 141, pattern: /new Date\(pricing\.priceLockAt\)\.toLocaleString/, description: 'Sin timezone' },
    ],
    mustHave: 'formatInClinicTz',
  },
  'src/app/platform/users/page.tsx': {
    severity: 'MEDIA',
    issues: [
      { line: 251, pattern: /new Date\(user\.created_at\)\.toLocaleDateString/, description: 'Sin timezone' },
    ],
    mustHave: 'formatInClinicTz',
  },
  'src/app/platform/audit/page.tsx': {
    severity: 'MEDIA',
    issues: [
      { line: 126, pattern: /new Date\(log\.createdAt\)\.toLocaleString/, description: 'Sin timezone' },
      { line: 264, pattern: /new Date\(log\.createdAt\)\.toLocaleString/, description: 'Sin timezone' },
    ],
    mustHave: 'formatInClinicTz',
  },
};

const FRONTEND_ROOT = 'vibralive-frontend';

class TimezoneVerifier {
  constructor() {
    this.results = {
      fixed: [],
      remaining: [],
      errors: [],
      summary: {
        total: 0,
        fixed: 0,
        remaining: 0,
      }
    };
  }

  verify() {
    console.log('🔍 Verificando estado de correcciones de timezone...\n');
    
    Object.entries(FIXES_NEEDED).forEach(([file, config]) => {
      const filePath = path.join(FRONTEND_ROOT, file);
      
      try {
        if (!fs.existsSync(filePath)) {
          this.results.errors.push(`❌ Archivo no encontrado: ${file}`);
          return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        const fileIssues = {
          file,
          severity: config.severity,
          fixed: [],
          remaining: [],
          hasImport: false,
        };

        // Verificar que tenga el import requerido
        const importCheck = config.mustHave.split(' or ').some(imp => content.includes(imp));
        fileIssues.hasImport = importCheck;

        // Verificar cada issue
        config.issues.forEach(issue => {
          const lineContent = lines[issue.line - 1] || '';
          
          if (lineContent.match(issue.pattern)) {
            fileIssues.remaining.push({
              line: issue.line,
              description: issue.description,
              preview: lineContent.trim().substring(0, 70),
            });
          } else {
            fileIssues.fixed.push({
              line: issue.line,
              description: issue.description,
            });
          }
        });

        // Categorizar
        if (fileIssues.remaining.length === 0) {
          this.results.fixed.push(fileIssues);
          this.results.summary.fixed++;
        } else {
          this.results.remaining.push(fileIssues);
          this.results.summary.remaining += fileIssues.remaining.length;
        }

        this.results.summary.total += config.issues.length;

      } catch (error) {
        this.results.errors.push(`⚠️ Error verificando ${file}: ${error.message}`);
      }
    });

    this.printResults();
  }

  printResults() {
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Summary
    const totalFixed = this.results.summary.fixed;
    const totalRemaining = this.results.summary.remaining;
    const percentComplete = Math.round((totalFixed / (totalFixed + totalRemaining)) * 100);
    
    console.log(`📊 PROGRESS: ${totalFixed}/${totalFixed + totalRemaining} problemas resueltos (${percentComplete}%)\n`);

    // Errores
    if (this.results.errors.length > 0) {
      console.log('⚠️  ERRORES:\n');
      this.results.errors.forEach(err => console.log(`   ${err}`));
      console.log('');
    }

    // Archivos ya corregidos
    if (this.results.fixed.length > 0) {
      console.log('✅ CORREGIDOS:\n');
      this.results.fixed.forEach(file => {
        const icon = file.hasImport ? '✓' : '?';
        console.log(`   ${icon} ${file.file} [${file.severity}]`);
        if (!file.hasImport) {
          console.log(`      ⚠️  Falta import requerido`);
        }
      });
      console.log('');
    }

    // Archivos pendientes
    if (this.results.remaining.length > 0) {
      console.log('🔴 PENDIENTES:\n');
      this.results.remaining.forEach(file => {
        console.log(`   📄 ${file.file} [${file.severity}]`);
        if (!file.hasImport) {
          console.log(`      ⚠️  FALTA IMPORT REQUERIDO`);
        }
        file.remaining.forEach(issue => {
          console.log(`      └─ Línea ${issue.line}: ${issue.description}`);
          console.log(`         ${issue.preview}...`);
        });
        console.log('');
      });
    }

    // Resumen final
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n📈 ESTADÍSTICAS:`);
    console.log(`   • Total de issues: ${this.results.summary.total}`);
    console.log(`   • Corregidos: ${totalFixed} ✅`);
    console.log(`   • Pendientes: ${totalRemaining} 🔴`);
    console.log(`   • Progreso: ${percentComplete}%`);
    console.log('\n');

    if (totalRemaining === 0) {
      console.log('🎉 ¡TODOS LOS PROBLEMAS HAN SIDO CORREGIDOS!');
    } else {
      console.log(`⚡ ${totalRemaining} issues aún requieren atención`);
    }
  }

  exportJSON() {
    const jsonPath = 'timezone-fixes-status.json';
    fs.writeFileSync(jsonPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      progress: {
        total: this.results.summary.total,
        fixed: this.results.summary.fixed,
        remaining: this.results.summary.remaining,
        percentage: Math.round((this.results.summary.fixed / this.results.summary.total) * 100),
      },
      files: {
        fixed: this.results.fixed.map(f => f.file),
        remaining: this.results.remaining.map(f => ({
          file: f.file,
          issueCount: f.remaining.length,
          issues: f.remaining,
        })),
      },
    }, null, 2));
    
    console.log(`\n📁 Status JSON exportado a: ${jsonPath}`);
  }
}

// Ejecutar
if (require.main === module) {
  const verifier = new TimezoneVerifier();
  verifier.verify();
  verifier.exportJSON();
}

module.exports = TimezoneVerifier;
