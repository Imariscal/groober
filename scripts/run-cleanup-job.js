/**
 * Script para ejecutar manualmente el job de limpieza de citas UNATTENDED
 * 
 * Uso: node scripts/run-cleanup-job.js
 * 
 * Este script:
 * 1. Busca citas con estado SCHEDULED o CONFIRMED de días anteriores a hoy
 * 2. Las marca como UNATTENDED para revisión del staff
 */

const { Client } = require('pg');

// Configuración de la base de datos (ajustar según tu .env)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  database: process.env.DB_NAME || 'vibralive_db',
  user: process.env.DB_USER || 'vibralive_dev',
  password: process.env.DB_PASSWORD || 'vibralive_password',
};

async function runCleanupJob() {
  const client = new Client(dbConfig);
  
  console.log('🔄 Iniciando job de limpieza de citas no atendidas...\n');
  console.log(`📅 Fecha de corte: ${new Date().toISOString().split('T')[0]} (inicio del día de hoy)`);
  console.log(`🔌 Conectando a: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}\n`);
  
  try {
    await client.connect();
    console.log('✅ Conexión establecida\n');
    
    // Inicio del día de hoy (las citas de hoy no se tocan)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 1. Primero ver cuántas citas hay pendientes
    const countQuery = `
      SELECT COUNT(*) as total, clinic_id
      FROM appointments
      WHERE status IN ('SCHEDULED', 'CONFIRMED')
        AND scheduled_at < $1
      GROUP BY clinic_id
    `;
    
    const countResult = await client.query(countQuery, [today.toISOString()]);
    
    if (countResult.rows.length === 0) {
      console.log('📭 No hay citas pendientes de días anteriores. Todo limpio!\n');
      return;
    }
    
    console.log('📊 Citas encontradas por clínica:');
    let totalAppointments = 0;
    countResult.rows.forEach(row => {
      console.log(`   • Clínica ${row.clinic_id}: ${row.total} citas`);
      totalAppointments += parseInt(row.total);
    });
    console.log(`   📌 Total: ${totalAppointments} citas\n`);
    
    // 2. Mostrar detalle de las citas que se van a marcar
    const detailQuery = `
      SELECT 
        a.id,
        a.status,
        a.scheduled_at,
        a.clinic_id,
        p.name as pet_name,
        c.name as client_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE a.status IN ('SCHEDULED', 'CONFIRMED')
        AND a.scheduled_at < $1
      ORDER BY a.scheduled_at DESC
      LIMIT 20
    `;
    
    const detailResult = await client.query(detailQuery, [today.toISOString()]);
    
    if (detailResult.rows.length > 0) {
      console.log('📋 Primeras 20 citas a marcar:');
      detailResult.rows.forEach(row => {
        const date = new Date(row.scheduled_at).toLocaleDateString('es-MX');
        console.log(`   • [${row.status}] ${row.pet_name || 'Sin mascota'} - ${row.client_name || 'Sin cliente'} - ${date}`);
      });
      console.log('');
    }
    
    // 3. Ejecutar la actualización
    const updateQuery = `
      UPDATE appointments
      SET 
        status = 'UNATTENDED',
        updated_at = NOW()
      WHERE status IN ('SCHEDULED', 'CONFIRMED')
        AND scheduled_at < $1
    `;
    
    const updateResult = await client.query(updateQuery, [today.toISOString()]);
    
    console.log(`✅ Job completado: ${updateResult.rowCount} citas marcadas como UNATTENDED\n`);
    
    // 4. Verificar el resultado
    const verifyQuery = `
      SELECT COUNT(*) as total
      FROM appointments
      WHERE status = 'UNATTENDED'
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log(`📊 Total de citas UNATTENDED en el sistema: ${verifyResult.rows[0].total}\n`);
    
  } catch (error) {
    console.error('❌ Error ejecutando el job:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar
runCleanupJob();
