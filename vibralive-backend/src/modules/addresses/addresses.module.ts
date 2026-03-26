import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientAddress } from '@/database/entities/client-address.entity';
import { Client } from '@/database/entities/client.entity';
import { Clinic } from '@/database/entities/clinic.entity';
import { ClientAddressesService } from './addresses.service';
import { ClientAddressesController } from './addresses.controller';
import { ClientAddressesRepository } from './repositories';

@Module({
  imports: [TypeOrmModule.forFeature([ClientAddress, Client, Clinic])],
  controllers: [ClientAddressesController],
  providers: [ClientAddressesService, ClientAddressesRepository],
  exports: [ClientAddressesService, ClientAddressesRepository],
})
export class ClientAddressesModule {}
