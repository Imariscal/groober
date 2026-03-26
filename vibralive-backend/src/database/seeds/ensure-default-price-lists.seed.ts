import { DataSource } from 'typeorm';
import { Clinic } from '../entities/clinic.entity';
import { PriceList } from '../entities/price-list.entity';
import { Service } from '../entities/service.entity';
import { ServicePrice } from '../entities/service-price.entity';

/**
 * Seed: Ensure all clinics have a default price list
 * 
 * This seed runs ONCE during initial setup to guarantee that:
 * 1. Every clinic has exactly one default price list
 * 2. Every existing service is added to that default price list
 * 
 * After this seed, PriceListsService.ensureDefaultPriceListExists()
 * will maintain this invariant for new clinics
 */
export async function ensureDefaultPriceListsSeed(dataSource: DataSource) {
  const clinicRepo = dataSource.getRepository(Clinic);
  const priceListRepo = dataSource.getRepository(PriceList);
  const serviceRepo = dataSource.getRepository(Service);
  const servicePriceRepo = dataSource.getRepository(ServicePrice);

  console.log('🌱 Starting: Ensure default price lists for all clinics...');

  const clinics = await clinicRepo.find({ where: { status: 'ACTIVE' } });
  console.log(`📋 Found ${clinics.length} active clinics`);

  for (const clinic of clinics) {
    console.log(`\n🏥 Processing clinic: ${clinic.name} (${clinic.id})`);

    // Check if clinic already has a default price list
    let defaultPriceList = await priceListRepo.findOne({
      where: {
        clinicId: clinic.id,
        isDefault: true,
        isActive: true,
      },
    });

    // If not, create it
    if (!defaultPriceList) {
      console.log(`  ✓ Creating default price list for clinic...`);
      defaultPriceList = priceListRepo.create({
        clinicId: clinic.id,
        name: 'Default Price List',
        isDefault: true,
        isActive: true,
      });
      defaultPriceList = await priceListRepo.save(defaultPriceList);
      console.log(`  ✓ Default price list created: ${defaultPriceList.id}`);
    } else {
      console.log(`  ✓ Default price list already exists: ${defaultPriceList.id}`);
    }

    // Get all services for this clinic
    const services = await serviceRepo.find({
      where: { clinicId: clinic.id },
    });
    console.log(`  📦 Found ${services.length} services`);

    // Ensure each service has a price in the default price list
    for (const service of services) {
      const existingPrice = await servicePriceRepo.findOne({
        where: {
          clinicId: clinic.id,
          priceListId: defaultPriceList.id,
          serviceId: service.id,
        },
      });

      if (!existingPrice) {
        const servicePrice = servicePriceRepo.create({
          clinicId: clinic.id,
          priceListId: defaultPriceList.id,
          serviceId: service.id,
          price: 0, // Default price is 0, to be configured by clinic admin
        });
        await servicePriceRepo.save(servicePrice);
        console.log(`    ✓ Service "${service.name}" added to default price list`);
      }
    }

    // Ensure all clients of this clinic have the default price list assigned
    // (This is handled by ClientsService during client creation)
  }

  console.log('\n✅ Seed complete: All clinics now have a default price list');
  return true;
}
