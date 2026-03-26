import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Client } from '@/database/entities/client.entity';
import { Pet } from '@/database/entities/pet.entity';
import { CampaignFilterDto } from '../dtos';

export interface FilteredRecipient {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  petId: string;
  petName: string;
}

/**
 * CampaignFilterService - Calculates eligible audience for campaigns
 * 
 * Converts JSON filter criteria into database queries to find
 * clients and pets matching campaign audience target.
 * 
 * Supports:
 * - Pet-based filters: species, breed, sex, size, sterilized, age, microchip, active, deceased
 * - Client-based filters: has_contact_info, active, creation date, last visit, pet count, pending appointments
 */
@Injectable()
export class CampaignFilterService {
  private readonly logger = new Logger(CampaignFilterService.name);

  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    @InjectRepository(Pet)
    private petRepo: Repository<Pet>,
  ) {}

  /**
   * Calculates estimated audience size for a campaign
   * Quick count without fetching all records
   */
  async estimateAudience(
    clinicId: string,
    filter: CampaignFilterDto,
  ): Promise<number> {
    try {
      const query = this.buildQuery(clinicId, filter);
      return await query.getCount();
    } catch (error) {
      this.logger.error(
        `Error estimating audience: ${(error as Error).message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Gets preview of recipients that match filter
   * Limited to first N records for UI preview
   */
  async previewRecipients(
    clinicId: string,
    filter: CampaignFilterDto,
    limit: number = 50,
  ): Promise<FilteredRecipient[]> {
    try {
      const query = this.buildQuery(clinicId, filter).limit(limit);
      return await query.getRawMany();
    } catch (error) {
      this.logger.error(
        `Error previewing recipients: ${(error as Error).message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Gets all recipients matching filter
   * Paginated to handle large campaigns
   */
  async getRecipients(
    clinicId: string,
    filter: CampaignFilterDto,
    page: number = 1,
    pageSize: number = 1000,
  ): Promise<FilteredRecipient[]> {
    try {
      const skip = (page - 1) * pageSize;
      const query = this.buildQuery(clinicId, filter)
        .skip(skip)
        .limit(pageSize);

      return await query.getRawMany();
    } catch (error) {
      this.logger.error(
        `Error fetching recipients: ${(error as Error).message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Builds the core query for filtering recipients
   * Handles all filter combinations
   */
  private buildQuery(
    clinicId: string,
    filter: CampaignFilterDto,
  ): SelectQueryBuilder<Client> {
    let query = this.clientRepo
      .createQueryBuilder('client')
      .innerJoin('client.pets', 'pet', 'pet.clinicId = :clinicId', { clinicId })
      .select('client.id', 'clientId')
      .addSelect('client.name', 'clientName')
      .addSelect('client.email', 'clientEmail')
      .addSelect('client.phone', 'clientPhone')
      .addSelect('pet.id', 'petId')
      .addSelect('pet.name', 'petName')
      .where('client.clinicId = :clinicId', { clinicId });

    // Client filters
    if (filter.clientActive !== undefined) {
      if (filter.clientActive) {
        query = query.andWhere("client.status = :clientActive", {
          clientActive: 'ACTIVE',
        });
      } else {
        query = query.andWhere("client.status != :clientActive", {
          clientActive: 'ACTIVE',
        });
      }
    }

    if (filter.clientHasWhatsapp !== undefined) {
      if (filter.clientHasWhatsapp) {
        query = query.andWhere('client.phone IS NOT NULL AND client.phone != \'\'');
      }
    }

    if (filter.clientHasEmail !== undefined) {
      if (filter.clientHasEmail) {
        query = query.andWhere('client.email IS NOT NULL AND client.email != \'\'');
      }
    }

    if (filter.clientCreatedAfter) {
      query = query.andWhere('client.createdAt >= :createdAfter', {
        createdAfter: new Date(filter.clientCreatedAfter),
      });
    }

    if (filter.clientLastVisitAfter) {
      query = query.andWhere(
        'EXISTS (SELECT 1 FROM appointments a WHERE a.clinicId = :clinicId AND a.clientId = client.id AND a.appointmentAt >= :lastVisitAfter)',
        { lastVisitAfter: new Date(filter.clientLastVisitAfter) },
      );
    }

    if (filter.clientLastVisitBefore) {
      query = query.andWhere(
        'NOT EXISTS (SELECT 1 FROM appointments a WHERE a.clinicId = :clinicId AND a.clientId = client.id AND a.appointmentAt > :lastVisitBefore)',
        { lastVisitBefore: new Date(filter.clientLastVisitBefore) },
      );
    }

    // Pet filters
    if (filter.species && filter.species.length > 0) {
      query = query.andWhere('pet.species IN (:...species)', {
        species: filter.species,
      });
    }

    if (filter.breed && filter.breed.length > 0) {
      query = query.andWhere('pet.breed IN (:...breed)', {
        breed: filter.breed,
      });
    }

    if (filter.sex && filter.sex.length > 0) {
      query = query.andWhere('pet.sex IN (:...sex)', { sex: filter.sex });
    }

    if (filter.size && filter.size.length > 0) {
      query = query.andWhere('pet.size IN (:...size)', { size: filter.size });
    }

    if (filter.sterilized !== undefined) {
      query = query.andWhere('pet.sterilized = :sterilized', {
        sterilized: filter.sterilized,
      });
    }

    if (filter.ageMin !== undefined) {
      // Simplified: assumes age is stored as integer in years
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - filter.ageMin);
      query = query.andWhere('pet.dateOfBirth <= :maxBirthDate', {
        maxBirthDate,
      });
    }

    if (filter.ageMax !== undefined) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - filter.ageMax);
      query = query.andWhere('pet.dateOfBirth >= :minBirthDate', {
        minBirthDate,
      });
    }

    if (filter.microchip !== undefined) {
      if (filter.microchip) {
        query = query.andWhere('pet.microchipNumber IS NOT NULL');
      } else {
        query = query.andWhere('pet.microchipNumber IS NULL');
      }
    }

    if (filter.petActive !== undefined) {
      if (filter.petActive) {
        query = query.andWhere('pet.isDeceased = :petActive', {
          petActive: false,
        });
      } else {
        query = query.andWhere('pet.isDeceased = :petActive', {
          petActive: true,
        });
      }
    }

    if (filter.petDeceased !== undefined) {
      if (filter.petDeceased) {
        query = query.andWhere('pet.deceasedAt IS NOT NULL');
      } else {
        query = query.andWhere('pet.deceasedAt IS NULL');
      }
    }

    // Pet count filters
    if (filter.clientMinPets !== undefined || filter.clientMaxPets !== undefined) {
      const minPets = filter.clientMinPets || 0;
      const maxPets = filter.clientMaxPets || 999;

      query = query.andWhere(
        `(SELECT COUNT(p.id) FROM pets p WHERE p.clinicId = :clinicId AND p.clientId = client.id) 
         BETWEEN :minPets AND :maxPets`,
        { minPets, maxPets },
      );
    }

    // Pending appointments filter
    if (filter.clientHasPendingAppointments !== undefined) {
      if (filter.clientHasPendingAppointments) {
        query = query.andWhere(
          `EXISTS (SELECT 1 FROM appointments a WHERE a.clinicId = :clinicId AND a.clientId = client.id AND a.appointmentAt > CURRENT_TIMESTAMP)`,
        );
      } else {
        query = query.andWhere(
          `NOT EXISTS (SELECT 1 FROM appointments a WHERE a.clinicId = :clinicId AND a.clientId = client.id AND a.appointmentAt > CURRENT_TIMESTAMP)`,
        );
      }
    }

    // Remove duplicates (same client may have multiple pets)
    query = query.distinct(true);

    return query;
  }

  /**
   * Validates filter structure before using it
   * Ensures all filter values are valid types
   */
  validateFilter(filter: CampaignFilterDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate species
    if (filter.species && !Array.isArray(filter.species)) {
      errors.push('species must be an array');
    }

    // Validate breed
    if (filter.breed && !Array.isArray(filter.breed)) {
      errors.push('breed must be an array');
    }

    // Validate dates
    if (filter.clientCreatedAfter) {
      try {
        new Date(filter.clientCreatedAfter);
      } catch {
        errors.push('clientCreatedAfter must be valid ISO date');
      }
    }

    if (filter.clientLastVisitBefore) {
      try {
        new Date(filter.clientLastVisitBefore);
      } catch {
        errors.push('clientLastVisitBefore must be valid ISO date');
      }
    }

    // Validate age range
    if (
      filter.ageMin !== undefined &&
      filter.ageMax !== undefined &&
      filter.ageMin > filter.ageMax
    ) {
      errors.push('ageMin must be less than ageMax');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
