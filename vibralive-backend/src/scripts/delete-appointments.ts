import { DataSource } from 'typeorm';
import { AppDataSource } from '../database/data-source';

async function deleteAppointments() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const appointmentRepository = AppDataSource.getRepository('Appointment');
    
    // Delete appointments for 2026-03-03
    const result = await appointmentRepository
      .createQueryBuilder()
      .delete()
      .where("DATE(scheduled_at) = :date", { date: '2026-03-03' })
      .execute();

    console.log(`✅ Deleted ${result.affected} appointments for 2026-03-03`);

    // Show remaining appointments count
    const remaining = await appointmentRepository.count();
    console.log(`📊 Remaining appointments in database: ${remaining}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting appointments:', error);
    process.exit(1);
  }
}

deleteAppointments();
