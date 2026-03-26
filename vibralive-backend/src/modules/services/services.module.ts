import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Service, PriceList, ServicePrice, Clinic, ServicePackageItem, ServicePackagePrice, ServiceSizePrice } from '../../database/entities';
import { PriceListsModule } from '@/modules/price-lists/price-lists.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, PriceList, ServicePrice, Clinic, ServicePackageItem, ServicePackagePrice, ServiceSizePrice]),
    PriceListsModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
