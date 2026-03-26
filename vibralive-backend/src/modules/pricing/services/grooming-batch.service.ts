import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppointmentGroup } from '@/database/entities/appointment-group.entity';
import { PricingService } from '@/modules/pricing/pricing.service';
import { GroomingValidationService } from '@/modules/appointments/services/grooming-validation.service';
import {
  CreateBatchAppointmentWithPricingDto,
  BatchAppointmentPetDto,
} from '@/modules/pricing/dtos/batch-appointment.dto';

export interface BatchAppointmentResponse {
  groupId: string;
  appointments: Array<{
    appointmentId: string;
    petId: string;
    totalAmount: number;
    items: any[];
  }>;
  totalAmountCombined: number;
  excludedPets?: Array<{
    petId: string;
    reason: string;
  }>;
}

@Injectable()
export class GroomingBatchService {
  constructor(
    private pricingService: PricingService,
    private groomingValidationService: GroomingValidationService,
    private dataSource: DataSource,
  ) {}

  /**
   * Create multiple grooming appointments in a single transaction
   * 
   * PARTIAL BATCH SUPPORT:
   * - Validates each pet individually for conflicts
   * - If some pets have conflicts (blocking overlaps), they are excluded from creation
   * - Only valid pets are created in the batch
   * - Returns which pets were excluded and why
   */
  async createBatchAppointmentWithPricing(
    clinicId: string,
    dto: CreateBatchAppointmentWithPricingDto,
  ): Promise<BatchAppointmentResponse> {
    // Validation
    if (!dto.pets || dto.pets.length === 0) {
      throw new BadRequestException('At least one pet is required');
    }

    const petIds = dto.pets.map((p) => p.petId);
    if (new Set(petIds).size !== petIds.length) {
      throw new BadRequestException('Duplicate pets in batch');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const durationMinutes = dto.durationMinutes || 30;
    const locationType = dto.locationType || 'CLINIC';

    // ✅ INTELLIGENT VALIDATION: Check for temporal overlaps per pet
    // Collect conflicts instead of failing immediately
    const excludedPets: Array<{ petId: string; reason: string }> = [];
    const validPets: typeof dto.pets = [];

    for (const pet of dto.pets) {
      const hasTimeOverlap = await this.groomingValidationService.checkTimeOverlapForPet(
        clinicId,
        pet.petId,
        scheduledAt,
        durationMinutes,
      );

      if (hasTimeOverlap) {
        // Pet has blocking conflict, exclude from batch
        excludedPets.push({
          petId: pet.petId,
          reason: 'Pet has conflicting appointment at the scheduled time',
        });
      } else {
        validPets.push(pet);
      }
    }

    // If all pets have conflicts, throw error
    if (validPets.length === 0) {
      throw new BadRequestException(
        excludedPets.length === 1
          ? excludedPets[0].reason
          : `All pets have conflicting appointments: ${excludedPets.map((p) => p.reason).join('; ')}`
      );
    }

    // Validate each valid pet appointment before creating group
    for (const pet of validPets) {
      const validation = await this.groomingValidationService.validateGroomingAppointment({
        clinicId,
        locationType,
        scheduledAt,
        durationMinutes,
        petId: pet.petId,
        clientId: dto.clientId,
        addressId: dto.addressId,
        assignedStaffUserId: dto.assignedStaffUserId, // Include stylist assignment
      });

      if (!validation.valid) {
        throw new BadRequestException(`Validation failed for pet ${pet.petId}: ${validation.errors.join(', ')}`);
      }
    }

    // Create in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create appointment group
      const group = queryRunner.manager.create(AppointmentGroup, {
        clinicId,
        clientId: dto.clientId,
        scheduledAt,
        locationType,
        addressId: dto.addressId,
        notes: dto.notes,
      });

      const savedGroup = await queryRunner.manager.save(AppointmentGroup, group);

      // 2. Create appointments for each VALID pet (excluding those with conflicts)
      const appointments = [];
      let totalAmountCombined = 0;

      for (const petDto of validPets) {
        const result = await this.pricingService.createAppointmentWithFrozenPrices(
          {
            clinicId,
            clientId: dto.clientId,
            petId: petDto.petId,
            scheduledAt,
            durationMinutes,
            reason: petDto.reason,
            notes: petDto.reason, // reuse reason as notes if not specified
            locationType,
            serviceType: dto.serviceType,
            addressId: dto.addressId,
            assignedStaffUserId: dto.assignedStaffUserId,
            serviceIds: petDto.serviceIds,
            quantities: petDto.quantities,
            packageIds: petDto.packageIds,
            packageQuantities: petDto.packageQuantities,
            customPriceListId: dto.customPriceListId,
          },
          queryRunner,
        );

        // Link appointment to group
        await queryRunner.manager.update(
          'appointments',
          { id: result.appointmentId },
          { groupId: savedGroup.id },
        );

        appointments.push({
          appointmentId: result.appointmentId,
          petId: petDto.petId,
          totalAmount: result.totalAmount,
          items: result.items,
        });

        totalAmountCombined += result.totalAmount;
      }

      await queryRunner.commitTransaction();

      return {
        groupId: savedGroup.id,
        appointments,
        totalAmountCombined,
        ...(excludedPets.length > 0 && { excludedPets }),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
