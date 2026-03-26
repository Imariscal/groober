import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AppDataSource } from '../data-source';
import {
  Clinic,
  User,
  AnimalType,
  Client,
  Pet,
  Reminder,
  MessageLog,
  PlatformRole,
  PlatformUser,
  Role,
  Permission,
  RolePermission,
} from '../entities';
import {
  seedPlatformRoles,
  seedPlatformSuperAdmin,
} from './platform-roles.seed';
import { ensureDefaultPriceListsSeed } from './ensure-default-price-lists.seed';
import { seedClinicConfigurations } from './clinic-configurations.seed';
import { seedRbac } from './rbac.seed';

const seedDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Seeding database...');

    // 0. Seed platform roles and super admin
    const platformRoleRepository = AppDataSource.getRepository(PlatformRole);
    const platformUserRepository =
      AppDataSource.getRepository(PlatformUser);

    await seedPlatformRoles(platformRoleRepository);
    await seedPlatformSuperAdmin(platformUserRepository, platformRoleRepository);

    // 0.1 Seed RBAC (clinic roles and permissions)
    const roleRepository = AppDataSource.getRepository(Role);
    const permissionRepository = AppDataSource.getRepository(Permission);
    const rolePermissionRepository = AppDataSource.getRepository(RolePermission);
    await seedRbac(roleRepository, permissionRepository, rolePermissionRepository);

    // 1. Create SuperAdmin (Global) - Legacy
    const userRepository = AppDataSource.getRepository(User);
    const existingSuperAdmin = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.clinicId', 'user.role', 'user.status'])
      .where('user.email = :email', { email: 'superAdmin@vibralive.com' })
      .getOne();

    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('admin@1234', 10);
      const newId = crypto.randomUUID();
      
      await AppDataSource.query(
        `INSERT INTO "users" ("id", "clinic_id", "name", "email", "phone", "hashed_password", "role", "status") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newId, null, 'Super Administrator', 'superAdmin@vibralive.com', '525500000000', hashedPassword, 'superadmin', 'ACTIVE']
      );
      console.log('✅ SuperAdmin user created: superAdmin@vibralive.com');
    } else {
      console.log('⏭️  SuperAdmin user already exists');
    }

    // 1. Create clinic
    const clinicRepository = AppDataSource.getRepository(Clinic);
    const existingClinic = await clinicRepository
      .createQueryBuilder('clinic')
      .select(['clinic.id', 'clinic.name', 'clinic.phone'])
      .where('clinic.phone = :phone', { phone: '525512345678' })
      .getOne();

    let clinic: Clinic;
    if (!existingClinic) {
      const clinicId = crypto.randomUUID();
      await clinicRepository
        .createQueryBuilder()
        .insert()
        .into(Clinic)
        .values({
          id: clinicId,
          name: 'Clínica Veterinaria VibraTest',
          phone: '525512345678',
          responsable: 'Admin Test',
          city: 'Mexico City',
          country: 'MX',
          subscriptionPlan: 'starter',
          status: 'ACTIVE',
        })
        .execute();
      // Need to construct a Clinic object for subsequent use
      clinic = {
        id: clinicId,
        name: 'Clínica Veterinaria VibraTest',
        phone: '525512345678',
        responsable: 'Admin Test',
        city: 'Mexico City',
        country: 'MX',
        subscriptionPlan: 'starter',
        status: 'ACTIVE',
      } as Clinic;
      console.log('✅ Clinic created:', clinic.id);
    } else {
      clinic = existingClinic;
      console.log('⏭️  Clinic already exists:', clinic.id);
    }

    // 2. Create animal types
    const animalTypeRepository = AppDataSource.getRepository(AnimalType);
    const animalTypes = [
      'Perro',
      'Gato',
      'Conejo',
      'Ave',
      'Reptil',
      'Otro',
    ];

    for (const animalTypeName of animalTypes) {
      const exists = await animalTypeRepository
        .createQueryBuilder('animalType')
        .select(['animalType.id', 'animalType.name', 'animalType.clinicId'])
        .where('animalType.clinicId = :clinicId AND animalType.name = :name', {
          clinicId: clinic.id,
          name: animalTypeName,
        })
        .getOne();

      if (!exists) {
        await AppDataSource.query(
          `INSERT INTO "animal_types" ("clinic_id", "name") VALUES ($1, $2)`,
          [clinic.id, animalTypeName]
        );
        console.log(`✅ Animal type created: ${animalTypeName}`);
      }
    }

    // 3. Create owner user
    const existingUser = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.clinicId', 'user.role', 'user.status'])
      .where('user.clinicId = :clinicId AND user.email = :email', {
        clinicId: clinic.id,
        email: 'owner@vibralive.test',
      })
      .getOne();

    let ownerUser: User;
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);
      const newId = crypto.randomUUID();
      
      await AppDataSource.query(
        `INSERT INTO "users" ("id", "clinic_id", "name", "email", "phone", "hashed_password", "role", "status") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newId, clinic.id, 'Propietario', 'owner@vibralive.test', '5551234567', hashedPassword, 'owner', 'ACTIVE']
      );
      // Fetch the created user
      ownerUser = await userRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.email', 'user.clinicId', 'user.role', 'user.status'])
        .where('user.id = :id', { id: newId })
        .getOne() as User;
      console.log('✅ Owner user created: owner@vibralive.test');
    } else {
      ownerUser = existingUser;
      console.log('⏭️  Owner user already exists');
    }

    // 4. Create staff user
    const staffExists = await userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.clinicId', 'user.role', 'user.status'])
      .where('user.clinicId = :clinicId AND user.email = :email', {
        clinicId: clinic.id,
        email: 'staff@vibralive.test',
      })
      .getOne();

    if (!staffExists) {
      const hashedPassword = await bcrypt.hash('Staff@123456', 10);
      const newId = crypto.randomUUID();
      
      await AppDataSource.query(
        `INSERT INTO "users" ("id", "clinic_id", "name", "email", "phone", "hashed_password", "role", "status") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newId, clinic.id, 'Personal', 'staff@vibralive.test', '5559876543', hashedPassword, 'staff', 'ACTIVE']
      );
      console.log('✅ Staff user created: staff@vibralive.test');
    }

    // 5. Create test clients
    const clientRepository = AppDataSource.getRepository(Client);
    const testClients = [
      {
        name: 'Juan Pérez',
        phone: '5551111111',
        email: 'juan@email.com',
        address: 'Calle Principal 123',
      },
      {
        name: 'María García',
        phone: '5552222222',
        email: 'maria@email.com',
        address: 'Avenida Central 456',
      },
    ];

    for (const clientData of testClients) {
      const exists = await clientRepository
        .createQueryBuilder('client')
        .select(['client.id', 'client.phone', 'client.clinicId'])
        .where('client.clinicId = :clinicId AND client.phone = :phone', {
          clinicId: clinic.id,
          phone: clientData.phone,
        })
        .getOne();

      if (!exists) {
        const clientId = crypto.randomUUID();
        await AppDataSource.query(
          `INSERT INTO "clients" ("id", "clinic_id", "name", "phone", "email", "address") VALUES ($1, $2, $3, $4, $5, $6)`,
          [clientId, clinic.id, clientData.name, clientData.phone, clientData.email, clientData.address]
        );
        console.log(`✅ Client created: ${clientData.name}`);
      }
    }

    // 6. Create test pets and reminders
    const petRepository = AppDataSource.getRepository(Pet);
    const dogs = await animalTypeRepository
      .createQueryBuilder('animalType')
      .select(['animalType.id', 'animalType.name', 'animalType.clinicId'])
      .where('animalType.clinicId = :clinicId AND animalType.name = :name', {
        clinicId: clinic.id,
        name: 'Perro',
      })
      .getOne();

    const clients = await clientRepository
      .createQueryBuilder('client')
      .select(['client.id', 'client.name', 'client.clinicId'])
      .where('client.clinicId = :clinicId', { clinicId: clinic.id })
      .getMany();

    if (clients.length > 0) {
      const petExists = await petRepository
        .createQueryBuilder('pet')
        .select(['pet.id', 'pet.name', 'pet.clinicId', 'pet.clientId'])
        .where(
          'pet.clinicId = :clinicId AND pet.clientId = :clientId AND pet.name = :name',
          {
            clinicId: clinic.id,
            clientId: clients[0].id,
            name: 'Max',
          },
        )
        .getOne();

      if (!petExists) {
        const petId = crypto.randomUUID();
        await AppDataSource.query(
          `INSERT INTO "pets" ("id", "clinic_id", "client_id", "name", "species", "breed", "date_of_birth") 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [petId, clinic.id, clients[0].id, 'Max', 'Perro', 'Labrador', '2022-01-15']
        );
        console.log('✅ Test pet created: Max');
      }
    }

    console.log('✅ Database seeded successfully!');

    // Ensure all clinics have default price lists
    console.log('\n🌱 Ensuring default price lists for all clinics...');
    await ensureDefaultPriceListsSeed(AppDataSource);

    console.log('\n🌱 Seeding clinic configurations and Mexican holidays...');
    await seedClinicConfigurations(AppDataSource);

    console.log('\n📝 Platform Credentials:');
    console.log('   Email: admin@vibralive.test');
    console.log('   Password: Admin@123456');
    console.log('   Role: PLATFORM_SUPERADMIN');
    console.log('\n📝 Clinic Test Credentials:');
    console.log('   Owner Email: owner@vibralive.test');
    console.log('   Owner Password: Admin@123456');
    console.log('   Staff Email: staff@vibralive.test');
    console.log('   Staff Password: Staff@123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
