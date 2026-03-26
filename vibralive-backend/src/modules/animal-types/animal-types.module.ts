import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, HttpCode, HttpStatus, Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AnimalType, Pet, PetSpecies } from '@/database/entities';
import { AuthGuard, RoleGuard } from '@/common/guards';
import { Roles, CurrentClinic } from '@/common/decorators';
import { InjectRepository } from '@nestjs/typeorm';
import { IsString, Length } from 'class-validator';

// DTOs
export class CreateAnimalTypeDto {
  @IsString()
  @Length(1, 100)
  name!: string;
}

export class UpdateAnimalTypeDto {
  @IsString()
  @Length(1, 100)
  name!: string;
}

// Service
@Injectable()
export class AnimalTypesService {
  constructor(
    @InjectRepository(AnimalType)
    private animalTypeRepository: Repository<AnimalType>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  async createAnimalType(clinicId: string, createAnimalTypeDto: CreateAnimalTypeDto): Promise<AnimalType> {
    const existing = await this.animalTypeRepository.findOne({
      where: { clinicId: clinicId, name: createAnimalTypeDto.name },
    });

    if (existing) {
      throw new ConflictException('Animal type already exists');
    }

    const animalType = this.animalTypeRepository.create({
      clinicId: clinicId,
      ...createAnimalTypeDto,
    });

    return this.animalTypeRepository.save(animalType);
  }

  async getAnimalTypes(clinicId: string): Promise<AnimalType[]> {
    return this.animalTypeRepository.find({
      where: { clinicId: clinicId },
      order: { name: 'ASC' },
    });
  }

  async getAnimalTypeById(clinicId: string, typeId: number): Promise<AnimalType | null> {
    return this.animalTypeRepository.findOne({
      where: { id: typeId, clinicId: clinicId },
    });
  }

  async updateAnimalType(clinicId: string, typeId: number, updateAnimalTypeDto: UpdateAnimalTypeDto): Promise<AnimalType> {
    const animalType = await this.animalTypeRepository.findOne({
      where: { id: typeId, clinicId: clinicId },
    });

    if (!animalType) {
      throw new BadRequestException('Animal type not found');
    }

    animalType.name = updateAnimalTypeDto.name;
    return this.animalTypeRepository.save(animalType);
  }

  async deleteAnimalType(clinicId: string, typeId: number): Promise<void> {
    // Note: pets table uses 'species' (varchar) not animalTypeId FK
    // So we check if any pets have species matching this animal type name
    const animalType = await this.animalTypeRepository.findOne({
      where: { id: typeId, clinicId },
    });

    if (!animalType) {
      throw new BadRequestException('Animal type not found');
    }

    const petsUsingType = await this.petRepository.findOne({
      where: { clinicId: clinicId, species: animalType.name as PetSpecies },
    });

    if (petsUsingType) {
      throw new ConflictException('Cannot delete animal type with existing pets');
    }
    const result = await this.animalTypeRepository.delete({
      id: typeId,
      clinicId: clinicId,
    });

    if (result.affected === 0) {
      throw new BadRequestException('Animal type not found');
    }
  }
}

// Controller
@Controller('animal-types')
@UseGuards(AuthGuard, RoleGuard)
export class AnimalTypesController {
  constructor(private animalTypesService: AnimalTypesService) {}

  @Post()
  @Roles('owner')
  @HttpCode(HttpStatus.CREATED)
  async createAnimalType(
    @CurrentClinic() clinicId: string,
    @Body() createAnimalTypeDto: CreateAnimalTypeDto,
  ): Promise<AnimalType> {
    return this.animalTypesService.createAnimalType(clinicId, createAnimalTypeDto);
  }

  @Get()
  async getAnimalTypes(
    @CurrentClinic() clinicId: string,
  ): Promise<AnimalType[]> {
    return this.animalTypesService.getAnimalTypes(clinicId);
  }

  @Get(':id')
  async getAnimalTypeById(
    @CurrentClinic() clinicId: string,
    @Param('id') typeId: number,
  ): Promise<AnimalType | null> {
    return this.animalTypesService.getAnimalTypeById(clinicId, typeId);
  }

  @Patch(':id')
  @Roles('owner')
  async updateAnimalType(
    @CurrentClinic() clinicId: string,
    @Param('id') typeId: number,
    @Body() updateAnimalTypeDto: UpdateAnimalTypeDto,
  ): Promise<AnimalType> {
    return this.animalTypesService.updateAnimalType(clinicId, typeId, updateAnimalTypeDto);
  }

  @Delete(':id')
  @Roles('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAnimalType(
    @CurrentClinic() clinicId: string,
    @Param('id') typeId: number,
  ): Promise<void> {
    return this.animalTypesService.deleteAnimalType(clinicId, typeId);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([AnimalType, Pet])],
  controllers: [AnimalTypesController],
  providers: [AnimalTypesService],
  exports: [AnimalTypesService],
})
export class AnimalTypesModule {}
