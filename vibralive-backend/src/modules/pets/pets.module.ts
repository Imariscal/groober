import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet, AnimalType, Client, Clinic } from '@/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, AnimalType, Client, Clinic])],
  controllers: [],
  providers: [],
  exports: [],
})
export class PetsModule {}
