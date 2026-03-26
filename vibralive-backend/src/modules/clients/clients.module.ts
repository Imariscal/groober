import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Repository, Not } from 'typeorm';
import { Client, Pet, ClientTag, ClientAddress, PetSpecies, PetSex, PetSize } from '@/database/entities';
import { AuthGuard, RoleGuard } from '@/common/guards';
import { CurrentClinic } from '@/common/decorators';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientResponseDto,
  ClientTagDto,
  PetResponseDto,
  CreateClientPetInlineDto,
  ClientGrowthKPIsResponseDto,
} from '@/modules/clients/dtos';
import { PriceListsService } from '@/modules/price-lists/price-lists.service';
import { PriceListsModule } from '@/modules/price-lists/price-lists.module';
import { ClientTagsService } from '@/modules/clients/services/client-tags.service';
import { ClientValidator } from '@/modules/clients/validators/client.validator';

// Service
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(ClientTag)
    private clientTagRepository: Repository<ClientTag>,
    @InjectRepository(ClientAddress)
    private clientAddressRepository: Repository<ClientAddress>,
    private priceListsService: PriceListsService,
    private clientTagsService: ClientTagsService,
    private clientValidator: ClientValidator,
  ) {}

  async createClient(clinicId: string, createClientDto: CreateClientDto): Promise<ClientResponseDto> {
    const existing = await this.clientRepository
      .createQueryBuilder('client')
      .where('client.clinic_id = :clinicId', { clinicId })
      .andWhere('client.phone = :phone', { phone: createClientDto.phone })
      .getOne();

    if (existing) {
      throw new ConflictException('Ya existe un cliente con este número de teléfono');
    }

    // Validate that at least one address is provided
    if (!createClientDto.addresses || createClientDto.addresses.length === 0) {
      throw new BadRequestException('El cliente debe tener al menos una dirección');
    }

    // Validate new preferences
    this.clientValidator.validatePreferences(createClientDto);

    // Ensure default price list exists (critical requirement)
    let priceListId: string | undefined;

    // If a specific price list is provided, use it
    if (createClientDto.priceListId) {
      priceListId = createClientDto.priceListId;
    } else {
      // Otherwise, ensure and use the default price list
      const defaultPriceList = await this.priceListsService.ensureDefaultPriceListExists(clinicId);
      priceListId = defaultPriceList.id;
    }

    // Extract addresses and pets from payload
    const { addresses: addressesData, pets: petsData, ...clientPayload } = createClientDto as Omit<CreateClientDto, 'addresses' | 'pets'> & { addresses?: any; pets?: any };

    const client = this.clientRepository.create({
      clinicId: clinicId,
      name: clientPayload.name,
      phone: clientPayload.phone,
      email: clientPayload.email,
      address: clientPayload.address,
      notes: clientPayload.notes,
      priceListId: priceListId,
      whatsappNumber: clientPayload.whatsappNumber,
      phoneSecondary: clientPayload.phoneSecondary,
      preferredContactMethod: clientPayload.preferredContactMethod,
      preferredContactTimeStart: clientPayload.preferredContactTimeStart,
      preferredContactTimeEnd: clientPayload.preferredContactTimeEnd,
      housingType: clientPayload.housingType,
      accessNotes: clientPayload.accessNotes,
      serviceNotes: clientPayload.serviceNotes,
      doNotContact: clientPayload.doNotContact ?? false,
      doNotContactReason: clientPayload.doNotContactReason,
      status: clientPayload.status || 'ACTIVE',
    });

    const savedClient = await this.clientRepository.save(client);

    // Create addresses if provided
    if (addressesData && addressesData.length > 0) {
      const addressesToCreate: any[] = [];
      
      for (let index = 0; index < addressesData.length; index++) {
        const addr = addressesData[index];
        const isDefault = index === 0 && addr.isDefault !== false;
        
        const addressEntity = this.clientAddressRepository.create({
          clinicId: clinicId,
          clientId: savedClient.id,
          label: addr.label,
          street: addr.street,
          numberExt: addr.number_ext,
          numberInt: addr.number_int,
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zip_code,
          references: addr.references,
          isDefault: isDefault,
        });
        
        addressesToCreate.push(addressEntity);
      }

      await this.clientAddressRepository.save(addressesToCreate);
    }

    // Create pets if provided
    if (petsData && petsData.length > 0) {
      const petsToCreate: any[] = [];
      
      for (const pet of petsData) {
        const petEntity = this.petRepository.create({
          clinicId: clinicId,
          clientId: savedClient.id,
          name: pet.name,
          species: pet.species || 'DOG',
          breed: pet.breed,
          dateOfBirth: pet.dateOfBirth ? new Date(pet.dateOfBirth) : undefined,
          sex: pet.sex || 'UNKNOWN',
          isSterilized: pet.isSterilized ?? false,
          color: pet.color,
          size: pet.size,
          microchipNumber: pet.microchipNumber,
          tagNumber: pet.tagNumber,
          notes: pet.notes,
          allergies: pet.allergies,
        });
        
        petsToCreate.push(petEntity);
      }

      await this.petRepository.save(petsToCreate);
    }

    // Reload with relationships and map to response DTO
    const reloadedClient = await this.clientRepository
      .createQueryBuilder('client')
      .where('client.id = :clientId', { clientId: savedClient.id })
      .leftJoinAndSelect('client.addresses', 'addresses')
      .leftJoinAndSelect('client.tags', 'tags')
      .leftJoinAndSelect('client.pets', 'pets')
      .getOne();

    return this.mapToResponseDto(reloadedClient)!;
  }

  async getClients(
    clinicId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ClientResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // First get paginated client IDs
    const [clients, total] = await this.clientRepository
      .createQueryBuilder('client')
      .where('client.clinic_id = :clinicId', { clinicId })
      .skip(skip)
      .take(limit)
      .orderBy('client.created_at', 'DESC')
      .getManyAndCount();
    
    // Then load addresses, tags and pets for these clients
    if (clients.length > 0) {
      const clientIds = clients.map(c => c.id);
      const clientsWithRelations = await this.clientRepository
        .createQueryBuilder('client')
        .leftJoinAndSelect('client.addresses', 'addresses')
        .leftJoinAndSelect('client.tags', 'tags')
        .leftJoinAndSelect('client.pets', 'pets')
        .where('client.id IN (:...clientIds)', { clientIds })
        .orderBy('client.created_at', 'DESC')
        .getMany();
      
      // Create a map for quick lookup
      const clientMap = new Map(clientsWithRelations.map(c => [c.id, c]));
      
      // Replace clients with versions that have relations
      for (let i = 0; i < clients.length; i++) {
        const withRelations = clientMap.get(clients[i].id);
        if (withRelations) {
          clients[i] = withRelations;
        }
      }
    }

    // Map to response DTO
    return { 
      data: clients.map((c) => this.mapToResponseDto(c)!), 
      total 
    };
  }

  async getClientById(clinicId: string, clientId: string): Promise<ClientResponseDto | null> {
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .where('client.id = :clientId', { clientId })
      .andWhere('client.clinic_id = :clinicId', { clinicId })
      .leftJoinAndSelect('client.pets', 'pets')
      .leftJoinAndSelect('client.addresses', 'addresses')
      .leftJoinAndSelect('client.tags', 'tags')
      .getOne();

    return client ? this.mapToResponseDto(client) : null;
  }

  async getClientPets(clinicId: string, clientId: string): Promise<PetResponseDto[]> {
    // First verify the client exists and belongs to this clinic
    const client = await this.clientRepository.findOne({
      where: { id: clientId, clinicId },
    });

    if (!client) {
      throw new BadRequestException('Client not found');
    }

    const pets = await this.petRepository.find({
      where: { clinicId, clientId },
      order: { createdAt: 'DESC' },
    });

    return pets.map((p) => ({
      id: p.id,
      clinic_id: p.clinicId,
      client_id: p.clientId,
      name: p.name,
      species: p.species,
      breed: p.breed,
      date_of_birth: p.dateOfBirth,
      sex: p.sex,
      is_sterilized: p.isSterilized,
      color: p.color,
      size: p.size,
      microchip_number: p.microchipNumber,
      tag_number: p.tagNumber,
      external_reference: p.externalReference,
      notes: p.notes,
      allergies: p.allergies,
      blood_type: p.bloodType,
      is_deceased: p.isDeceased,
      deceased_at: p.deceasedAt,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }));
  }

  async createPet(clinicId: string, clientId: string, petData: CreateClientPetInlineDto): Promise<PetResponseDto> {
    // Verify client exists
    const client = await this.clientRepository.findOne({
      where: { id: clientId, clinicId },
    });

    if (!client) {
      throw new BadRequestException('Client not found');
    }

    // Validate microchip uniqueness if provided
    if (petData.microchipNumber) {
      const existingPet = await this.petRepository.findOne({
        where: { 
          clinicId, 
          microchipNumber: petData.microchipNumber,
        },
      });
      
      if (existingPet) {
        throw new BadRequestException('A pet with this microchip number already exists in this clinic');
      }
    }

    const pet = this.petRepository.create({
      clinicId,
      clientId,
      name: petData.name,
      species: petData.species as PetSpecies,
      breed: petData.breed,
      dateOfBirth: petData.dateOfBirth ? new Date(petData.dateOfBirth) : (null as unknown as Date),
      sex: (petData.sex || 'UNKNOWN') as PetSex,
      isSterilized: petData.isSterilized ?? false,
      color: petData.color,
      size: petData.size as PetSize | undefined,
      microchipNumber: petData.microchipNumber,
      tagNumber: petData.tagNumber,
      notes: petData.notes,
      allergies: petData.allergies,
    });

    const saved = await this.petRepository.save(pet);

    return {
      id: saved.id,
      clinic_id: saved.clinicId,
      client_id: saved.clientId,
      name: saved.name,
      species: saved.species,
      breed: saved.breed,
      date_of_birth: saved.dateOfBirth,
      sex: saved.sex,
      is_sterilized: saved.isSterilized,
      color: saved.color,
      size: saved.size,
      microchip_number: saved.microchipNumber,
      tag_number: saved.tagNumber,
      external_reference: saved.externalReference,
      notes: saved.notes,
      allergies: saved.allergies,
      blood_type: saved.bloodType,
      is_deceased: saved.isDeceased,
      deceased_at: saved.deceasedAt,
      created_at: saved.createdAt,
      updated_at: saved.updatedAt,
    };
  }

  async updatePet(clinicId: string, clientId: string, petId: string, petData: Partial<CreateClientPetInlineDto>): Promise<PetResponseDto> {
    const pet = await this.petRepository.findOne({
      where: { id: petId, clinicId, clientId },
    });

    if (!pet) {
      throw new BadRequestException('Pet not found');
    }

    // Validate microchip uniqueness if being updated
    if (petData.microchipNumber !== undefined && petData.microchipNumber && petData.microchipNumber !== pet.microchipNumber) {
      const existingPet = await this.petRepository.findOne({
        where: { 
          clinicId, 
          microchipNumber: petData.microchipNumber,
          id: Not(petId) // Exclude current pet
        },
      });
      
      if (existingPet) {
        throw new BadRequestException('A pet with this microchip number already exists in this clinic');
      }
    }

    // Update fields
    if (petData.name !== undefined) pet.name = petData.name;
    if (petData.species !== undefined) pet.species = petData.species as PetSpecies;
    if (petData.breed !== undefined) pet.breed = petData.breed || '';
    if (petData.dateOfBirth !== undefined) pet.dateOfBirth = petData.dateOfBirth ? new Date(petData.dateOfBirth) : (null as unknown as Date);
    if (petData.sex !== undefined) pet.sex = petData.sex as PetSex;
    if (petData.isSterilized !== undefined) pet.isSterilized = petData.isSterilized;
    if (petData.color !== undefined) pet.color = petData.color;
    if (petData.size !== undefined) pet.size = petData.size as PetSize | undefined;
    if (petData.microchipNumber !== undefined) pet.microchipNumber = petData.microchipNumber;
    if (petData.tagNumber !== undefined) pet.tagNumber = petData.tagNumber;
    if (petData.notes !== undefined) pet.notes = petData.notes;
    if (petData.allergies !== undefined) pet.allergies = petData.allergies;

    const saved = await this.petRepository.save(pet);

    return {
      id: saved.id,
      clinic_id: saved.clinicId,
      client_id: saved.clientId,
      name: saved.name,
      species: saved.species,
      breed: saved.breed,
      date_of_birth: saved.dateOfBirth,
      sex: saved.sex,
      is_sterilized: saved.isSterilized,
      color: saved.color,
      size: saved.size,
      microchip_number: saved.microchipNumber,
      tag_number: saved.tagNumber,
      external_reference: saved.externalReference,
      notes: saved.notes,
      allergies: saved.allergies,
      blood_type: saved.bloodType,
      is_deceased: saved.isDeceased,
      deceased_at: saved.deceasedAt,
      created_at: saved.createdAt,
      updated_at: saved.updatedAt,
    };
  }

  async deletePet(clinicId: string, clientId: string, petId: string): Promise<void> {
    const result = await this.petRepository.delete({
      id: petId,
      clinicId,
      clientId,
    });

    if (result.affected === 0) {
      throw new BadRequestException('Pet not found');
    }
  }

  async updateClient(
    clinicId: string,
    clientId: string,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .where('client.id = :clientId', { clientId })
      .andWhere('client.clinic_id = :clinicId', { clinicId })
      .leftJoinAndSelect('client.addresses', 'addresses')
      .getOne();

    if (!client) {
      throw new BadRequestException('Client not found');
    }

    // Validate that client has at least one address
    if (!client.addresses || client.addresses.length === 0) {
      throw new BadRequestException('El cliente debe tener al menos una dirección antes de actualizar');
    }

    // Validate new preferences if provided
    if (Object.keys(updateClientDto).length > 0) {
      this.clientValidator.validatePreferences(updateClientDto);
    }

    // Check for duplicate phone if phone is being updated
    if (updateClientDto.phone && updateClientDto.phone !== client.phone) {
      const existingClient = await this.clientRepository.findOne({
        where: { clinicId, phone: updateClientDto.phone },
      });
      if (existingClient && existingClient.id !== clientId) {
        throw new BadRequestException('Ya existe un cliente con este número de teléfono');
      }
    }

    Object.assign(client, updateClientDto);
    
    try {
      const savedClient = await this.clientRepository.save(client);

      // Reload with relationships
      const reloadedClient = await this.clientRepository
        .createQueryBuilder('client')
        .where('client.id = :clientId', { clientId: savedClient.id })
        .leftJoinAndSelect('client.pets', 'pets')
        .leftJoinAndSelect('client.addresses', 'addresses')
        .leftJoinAndSelect('client.tags', 'tags')
        .getOne();

      return this.mapToResponseDto(reloadedClient)!;
    } catch (error: any) {
      // Handle duplicate key constraint
      if (error.code === '23505') {
        throw new BadRequestException('Ya existe un cliente con este número de teléfono');
      }
      throw error;
    }
  }

  async deactivateClient(clinicId: string, clientId: string): Promise<ClientResponseDto> {
    // Soft delete: change status to INACTIVE
    const result = await this.clientRepository
      .createQueryBuilder()
      .update(Client)
      .set({ status: 'INACTIVE' })
      .where('id = :clientId', { clientId })
      .andWhere('clinic_id = :clinicId', { clinicId })
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException('Client not found');
    }

    // Return updated client
    const client = await this.getClientById(clinicId, clientId);
    if (!client) {
      throw new BadRequestException('Client not found after update');
    }
    return client;
  }

  async deleteClient(clinicId: string, clientId: string): Promise<void> {
    // Hard delete - requires elevated permissions
    const result = await this.clientRepository
      .createQueryBuilder()
      .delete()
      .from(Client)
      .where('id = :clientId', { clientId })
      .andWhere('clinic_id = :clinicId', { clinicId })
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException('Client not found');
    }
  }

  /**
   * Get strategic KPIs related to client growth/registration
   * Optimized single query using CTEs for performance
   */
  async getGrowthKPIs(clinicId: string): Promise<ClientGrowthKPIsResponseDto> {
    const result = await this.clientRepository.query(
      `WITH current_stats AS (
        SELECT 
          COUNT(*) AS total_clients,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS clients_today,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS clients_this_week,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS clients_this_month,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_clients
        FROM clients
        WHERE clinic_id = $1
      ),
      previous_month AS (
        SELECT COUNT(*) AS total_clients_last_month
        FROM clients
        WHERE clinic_id = $1
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
      )
      SELECT
        COALESCE((SELECT total_clients FROM current_stats), 0)::integer AS total_clients,
        COALESCE((SELECT clients_today FROM current_stats), 0)::integer AS new_clients_today,
        COALESCE((SELECT clients_this_week FROM current_stats), 0)::integer AS new_clients_this_week,
        COALESCE((SELECT clients_this_month FROM current_stats), 0)::integer AS new_clients_this_month,
        COALESCE(
          ROUND(
            CASE 
              WHEN (SELECT total_clients_last_month FROM previous_month) = 0 THEN 0
              ELSE ((SELECT clients_this_month FROM current_stats)::numeric - 
                   (SELECT total_clients_last_month FROM previous_month)::numeric) / 
                  (SELECT total_clients_last_month FROM previous_month)::numeric * 100
            END,
            2
          ), 0
        )::numeric AS growth_percentage,
        COALESCE(
          ROUND(
            CASE 
              WHEN EXTRACT(DAY FROM NOW()) = 0 THEN 0
              ELSE (SELECT clients_this_month FROM current_stats)::numeric / EXTRACT(DAY FROM NOW())::numeric
            END,
            2
          ), 0
        )::numeric AS daily_average,
        COALESCE((SELECT active_clients FROM current_stats), 0)::integer AS active_clients,
        COALESCE((SELECT total_clients_last_month FROM previous_month), 0)::integer AS clients_last_month;`,
      [clinicId],
    );

    const data = result[0] || {};
    
    return {
      success: true,
      data: {
        newClientsToday: parseInt(data.new_clients_today) || 0,
        newClientsThisWeek: parseInt(data.new_clients_this_week) || 0,
        newClientsThisMonth: parseInt(data.new_clients_this_month) || 0,
        growthPercentage: parseFloat(data.growth_percentage) || 0,
        clientsLastMonth: parseInt(data.clients_last_month) || 0,
        dailyAverage: parseFloat(data.daily_average) || 0,
        activeClients: parseInt(data.active_clients) || 0,
        totalClients: parseInt(data.total_clients) || 0,
        timestamp: new Date(),
      },
    };
  }

  private mapToResponseDto(client: Client | null): ClientResponseDto | null {
    if (!client) return null;

    return {
      id: client.id,
      clinicId: client.clinicId,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      notes: client.notes,
      priceListId: client.priceListId,
      whatsappNumber: client.whatsappNumber,
      phoneSecondary: client.phoneSecondary,
      preferredContactMethod: client.preferredContactMethod,
      preferredContactTimeStart: client.preferredContactTimeStart,
      preferredContactTimeEnd: client.preferredContactTimeEnd,
      housingType: client.housingType,
      accessNotes: client.accessNotes,
      serviceNotes: client.serviceNotes,
      doNotContact: client.doNotContact,
      doNotContactReason: client.doNotContactReason,
      status: client.status,
      tags: client.tags?.map((t) => t.tag) || [],
      addresses: client.addresses?.map((a) => ({
        id: a.id,
        clinic_id: a.clinicId,
        client_id: a.clientId,
        label: a.label,
        street: a.street,
        number_ext: a.numberExt,
        number_int: a.numberInt,
        neighborhood: a.neighborhood,
        city: a.city,
        state: a.state,
        zip_code: a.zipCode,
        references: a.references,
        lat: a.lat,
        lng: a.lng,
        geocode_status: a.geocodeStatus,
        is_default: a.isDefault,
        created_at: a.createdAt,
        updated_at: a.updatedAt,
      })) || [],
      pets: client.pets?.map((p) => ({
        id: p.id,
        clinic_id: p.clinicId,
        client_id: p.clientId,
        name: p.name,
        species: p.species,
        breed: p.breed,
        date_of_birth: p.dateOfBirth,
        sex: p.sex,
        is_sterilized: p.isSterilized,
        color: p.color,
        size: p.size,
        microchip_number: p.microchipNumber,
        tag_number: p.tagNumber,
        external_reference: p.externalReference,
        notes: p.notes,
        allergies: p.allergies,
        blood_type: p.bloodType,
        is_deceased: p.isDeceased,
        deceased_at: p.deceasedAt,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })) || [],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    } as ClientResponseDto;
  }
}

// Controller
@Controller('clients')
@UseGuards(AuthGuard, RoleGuard)
export class ClientsController {
  constructor(
    private clientsService: ClientsService,
    private clientTagsService: ClientTagsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClient(
    @CurrentClinic() clinicId: string,
    @Body() createClientDto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.createClient(clinicId, createClientDto);
  }

  @Get()
  async getClients(
    @CurrentClinic() clinicId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    return this.clientsService.getClients(clinicId, pageNum, limitNum);
  }

  @Get('dashboard/growth-kpis')
  async getGrowthKPIs(
    @CurrentClinic() clinicId: string,
  ): Promise<ClientGrowthKPIsResponseDto> {
    return this.clientsService.getGrowthKPIs(clinicId);
  }

  @Get(':id')
  async getClientById(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
  ): Promise<ClientResponseDto | null> {
    return this.clientsService.getClientById(clinicId, clientId);
  }

  @Get(':id/tags')
  async getClientTags(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
  ): Promise<string[]> {
    return this.clientTagsService.getClientTags(clientId, clinicId);
  }

  @Get(':id/pets')
  async getClientPets(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
  ): Promise<PetResponseDto[]> {
    return this.clientsService.getClientPets(clinicId, clientId);
  }

  @Post(':id/pets')
  @HttpCode(HttpStatus.CREATED)
  async createPet(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
    @Body() petData: CreateClientPetInlineDto,
  ): Promise<PetResponseDto> {
    return this.clientsService.createPet(clinicId, clientId, petData);
  }

  @Patch(':id/pets/:petId')
  async updatePet(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
    @Param('petId') petId: string,
    @Body() petData: Partial<CreateClientPetInlineDto>,
  ): Promise<PetResponseDto> {
    return this.clientsService.updatePet(clinicId, clientId, petId, petData);
  }

  @Delete(':id/pets/:petId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePet(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
    @Param('petId') petId: string,
  ): Promise<void> {
    return this.clientsService.deletePet(clinicId, clientId, petId);
  }

  @Post(':id/tags')
  @HttpCode(HttpStatus.CREATED)
  async addTag(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
    @Body() body: ClientTagDto,
  ) {
    // Mock user object - in real app would come from @CurrentUser() decorator
    const user = { id: 'system', email: 'system@vibralive.com' };
    return this.clientTagsService.addTag(clientId, clinicId, body.tag, user);
  }

  @Delete(':id/tags/:tag')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTag(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
    @Param('tag') tag: string,
  ): Promise<void> {
    // Mock user object - in real app would come from @CurrentUser() decorator
    const user = { id: 'system', email: 'system@vibralive.com' };
    await this.clientTagsService.removeTag(clientId, clinicId, tag, user);
  }

  @Patch(':id')
  async updateClient(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.updateClient(clinicId, clientId, updateClientDto);
  }

  @Patch(':id/deactivate')
  async deactivateClient(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
  ): Promise<ClientResponseDto> {
    return this.clientsService.deactivateClient(clinicId, clientId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClient(
    @CurrentClinic() clinicId: string,
    @Param('id') clientId: string,
  ): Promise<void> {
    return this.clientsService.deleteClient(clinicId, clientId);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([Client, Pet, ClientTag, ClientAddress]), PriceListsModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientTagsService, ClientValidator],
  exports: [ClientsService, ClientTagsService],
})
export class ClientsModule {}
