import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic, PriceList, ServicePrice, PriceListHistory, ServicePackagePrice, ServicePackage, ServiceSizePrice } from '@/database/entities';
import { PriceListsService } from './price-lists.service';
import { PriceListsController } from './price-lists.controller';
import { ServicePackagePriceRepository } from '../pricing/repositories/service-package-price.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PriceList, Clinic, ServicePrice, ServiceSizePrice, PriceListHistory, ServicePackagePrice, ServicePackage])],
  providers: [PriceListsService, ServicePackagePriceRepository],
  controllers: [PriceListsController],
  exports: [PriceListsService],
})
export class PriceListsModule {}

