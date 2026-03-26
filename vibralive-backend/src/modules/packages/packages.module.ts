import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { ServicePackage, ServicePackageItem, Service, Clinic, ServicePrice, PriceList, ServicePackagePrice } from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServicePackage, ServicePackageItem, Service, Clinic, ServicePrice, PriceList, ServicePackagePrice]),
  ],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
