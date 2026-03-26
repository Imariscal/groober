import { getRepository } from 'typeorm';
import { PriceList } from '../../database/entities/price-list.entity';
import { Service } from '../../database/entities/service.entity';
import { ServicePrice } from '../../database/entities/service-price.entity';

export async function seedDefaultPriceList(clinicId: string) {
  const priceListRepo = getRepository(PriceList);
  const serviceRepo = getRepository(Service);
  const priceRepo = getRepository(ServicePrice);

  let priceList = await priceListRepo.findOne({ where: { clinicId, isDefault: true } });
  if (!priceList) {
    priceList = priceListRepo.create({ clinicId, name: 'Default Price List', isDefault: true, isActive: true });
    await priceListRepo.save(priceList);
  }

  const services = await serviceRepo.find({ where: { clinicId } });
  for (const service of services) {
    const exists = await priceRepo.findOne({ where: { clinicId, priceListId: priceList.id, serviceId: service.id } });
    if (!exists) {
      await priceRepo.save(priceRepo.create({ clinicId, priceListId: priceList.id, serviceId: service.id, price: 0 }));
    }
  }
}
