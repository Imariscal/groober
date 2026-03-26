import { DataSource, Repository } from 'typeorm';
import { ClinicConfiguration, ClinicCalendarException, CalendarExceptionType, BusinessHours, Clinic } from '../entities';

// Mexican holidays for 2024 and 2025
const MEXICAN_HOLIDAYS = [
  // 2024
  { date: '2024-01-01', reason: 'Año Nuevo', type: 'CLOSED' as CalendarExceptionType },
  { date: '2024-02-05', reason: 'Día de la Constitución', type: 'CLOSED' as CalendarExceptionType },
  { date: '2024-03-18', reason: 'Natalicio de Benito Juárez', type: 'CLOSED' as CalendarExceptionType },
  { date: '2024-05-01', reason: 'Día del Trabajo', type: 'CLOSED' as CalendarExceptionType },
  { date: '2024-09-16', reason: 'Independencia de México', type: 'CLOSED' as CalendarExceptionType },
  { date: '2024-11-18', reason: 'Revolución Mexicana', type: 'CLOSED' as CalendarExceptionType },
  { date: '2024-12-25', reason: 'Navidad', type: 'CLOSED' as CalendarExceptionType },

  // 2025
  { date: '2025-01-01', reason: 'Año Nuevo', type: 'CLOSED' as CalendarExceptionType },
  { date: '2025-02-03', reason: 'Día de la Constitución', type: 'CLOSED' as CalendarExceptionType },
  { date: '2025-03-17', reason: 'Natalicio de Benito Juárez', type: 'CLOSED' as CalendarExceptionType },
  { date: '2025-05-01', reason: 'Día del Trabajo', type: 'CLOSED' as CalendarExceptionType },
  { date: '2025-09-16', reason: 'Independencia de México', type: 'CLOSED' as CalendarExceptionType },
  { date: '2025-11-17', reason: 'Revolución Mexicana', type: 'CLOSED' as CalendarExceptionType },
  { date: '2025-12-25', reason: 'Navidad', type: 'CLOSED' as CalendarExceptionType },

  // 2026
  { date: '2026-01-01', reason: 'Año Nuevo', type: 'CLOSED' as CalendarExceptionType },
  { date: '2026-02-02', reason: 'Día de la Constitución', type: 'CLOSED' as CalendarExceptionType },
  { date: '2026-03-16', reason: 'Natalicio de Benito Juárez', type: 'CLOSED' as CalendarExceptionType },
  { date: '2026-05-01', reason: 'Día del Trabajo', type: 'CLOSED' as CalendarExceptionType },
  { date: '2026-09-16', reason: 'Independencia de México', type: 'CLOSED' as CalendarExceptionType },
  { date: '2026-11-16', reason: 'Revolución Mexicana', type: 'CLOSED' as CalendarExceptionType },
  { date: '2026-12-25', reason: 'Navidad', type: 'CLOSED' as CalendarExceptionType },
];

// Business hours: 8 AM to 6 PM every day of the week
const BUSINESS_HOURS: BusinessHours = {
  week: {
    mon: [{ start: '08:00', end: '18:00' }],
    tue: [{ start: '08:00', end: '18:00' }],
    wed: [{ start: '08:00', end: '18:00' }],
    thu: [{ start: '08:00', end: '18:00' }],
    fri: [{ start: '08:00', end: '18:00' }],
    sat: [{ start: '08:00', end: '18:00' }],
    sun: [{ start: '08:00', end: '18:00' }],
  },
};

export const seedClinicConfigurations = async (dataSource: DataSource) => {
  const clinicRepo = dataSource.getRepository(Clinic);
  const configRepo = dataSource.getRepository(ClinicConfiguration);
  const exceptionRepo = dataSource.getRepository(ClinicCalendarException);

  try {
    // Get all clinics
    const clinics = await clinicRepo.find();

    if (clinics.length === 0) {
      console.log('⏭️  No clinics found, skipping configuration seed');
      return;
    }

    for (const clinic of clinics) {
      // Check if configuration already exists
      const existingConfig = await configRepo.findOne({
        where: { clinicId: clinic.id },
      });

      if (!existingConfig) {
        // Create default configuration
        const config = configRepo.create({
          clinicId: clinic.id,
          timezone: 'America/Mexico_City',
          businessHours: BUSINESS_HOURS,
          clinicGroomingCapacity: 1,
          homeGroomingCapacity: 1,
          homeTravelBufferMinutes: 20,
          preventSamePetSameDay: true,
        });

        await configRepo.save(config);
        console.log(`✅ Configuration created for clinic: ${clinic.name}`);

        // Check and create Mexican holidays
        let holidaysCreated = 0;
        for (const holiday of MEXICAN_HOLIDAYS) {
          const existingHoliday = await exceptionRepo.findOne({
            where: {
              clinicId: clinic.id,
              date: holiday.date,
            },
          });

          if (!existingHoliday) {
            const exception = exceptionRepo.create({
              clinicId: clinic.id,
              date: holiday.date,
              type: holiday.type,
              reason: holiday.reason,
            });

            await exceptionRepo.save(exception);
            holidaysCreated++;
          }
        }

        console.log(`✅ Added ${holidaysCreated} Mexican holidays for clinic: ${clinic.name}`);
      } else {
        console.log(`⏭️  Configuration already exists for clinic: ${clinic.name}`);
      }
    }

    console.log('✅ Clinic configurations seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding clinic configurations:', error);
    throw error;
  }
};
