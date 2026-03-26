import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { AppDataSource } from '../data-source';
import { Appointment, WhatsAppOutbox, Clinic, Pet, Client } from '../entities';

/**
 * Seed Appointments and WhatsApp messages for testing
 */
export const seedAppointmentsAndWhatsApp = async (dataSource: DataSource) => {
  try {
    console.log('🌱 Seeding Appointments and WhatsApp Outbox...');

    const clinicRepository = dataSource.getRepository(Clinic);
    const clientRepository = dataSource.getRepository(Client);
    const petRepository = dataSource.getRepository(Pet);
    const appointmentRepository = dataSource.getRepository(Appointment);
    const whatsappRepository = dataSource.getRepository(WhatsAppOutbox);

    // Get clinic
    const clinic = await clinicRepository.findOne({
      where: { phone: '525512345678' }, // Test clinic
    });

    if (!clinic) {
      console.log('⚠️  Test clinic not found, skipping seed');
      return;
    }

    // Get first pet
    const pet = await petRepository.findOne({
      where: { clinic: { id: clinic.id } },
    });

    if (!pet) {
      console.log('⚠️  Test pet not found, skipping seed');
      return;
    }

    // Get first client
    const client = await clientRepository.findOne({
      where: { clinic: { id: clinic.id } },
    });

    if (!client) {
      console.log('⚠️  Test client not found, skipping seed');
      return;
    }

    // Create sample appointments
    const existingAppointment = await appointmentRepository.findOne({
      where: { clinic: { id: clinic.id }, pet: { id: pet.id } },
    });

    if (!existingAppointment) {
      const appointment = appointmentRepository.create({
        clinic: clinic,
        pet: pet,
        client: client,
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        status: 'SCHEDULED',
        reason: 'Annual check-up',
        durationMinutes: 30,
        notes: 'First appointment',
      });

      await appointmentRepository.save(appointment);
      console.log('✅ Sample appointment created');
    }

    // Create sample WhatsApp outbox messages
    const existingWhatsApp = await whatsappRepository.findOne({
      where: { clinic: { id: clinic.id } },
    });

    if (!existingWhatsApp) {
      const whatsappMessage = whatsappRepository.create({
        id: crypto.randomUUID(),
        clinic: clinic,
        client: client,
        phoneNumber: '+34612345678',
        messageBody: 'Your appointment has been confirmed for tomorrow at 10:00 AM',
        status: 'queued',
        idempotencyKey: `seed-${Date.now()}`,
        retryCount: 0,
        maxRetries: 5,
        channel: 'whatsapp',
        messageType: 'appointment_confirmation',
      });

      await whatsappRepository.save(whatsappMessage);
      console.log('✅ Sample WhatsApp message created');
    }

    console.log('✅ Appointments and WhatsApp seeded successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  const seed = async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    await seedAppointmentsAndWhatsApp(AppDataSource);

    process.exit(0);
  };

  seed().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}

export default seedAppointmentsAndWhatsApp;
