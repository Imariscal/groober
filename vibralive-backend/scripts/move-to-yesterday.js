/**
 * Script temporal para mover citas de hoy a ayer (para testing del job)
 */
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'vibralive_db',
  user: 'vibralive_dev',
  password: 'vibralive_password'
});

async function run() {
  await client.connect();
  console.log('✅ Conectado\n');
  
  // Ver citas de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const result = await client.query(
    'SELECT id, scheduled_at, status FROM appointments WHERE scheduled_at >= $1 AND scheduled_at < $2',
    [today.toISOString(), tomorrow.toISOString()]
  );
  
  console.log('📅 Citas de hoy encontradas:', result.rows.length);
  result.rows.forEach(r => console.log('  •', r.status, '-', new Date(r.scheduled_at).toLocaleString()));
  
  if (result.rows.length === 0) {
    console.log('\n⚠️  No hay citas de hoy para mover');
    await client.end();
    return;
  }
  
  // Actualizar a ayer
  const updateResult = await client.query(
    `UPDATE appointments SET scheduled_at = scheduled_at - INTERVAL '1 day' WHERE scheduled_at >= $1 AND scheduled_at < $2 RETURNING id`,
    [today.toISOString(), tomorrow.toISOString()]
  );
  
  console.log('\n✅ Citas movidas a ayer:', updateResult.rowCount);
  console.log('\n👉 Ahora puedes correr: npm run job:cleanup');
  
  await client.end();
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
