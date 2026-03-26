/**
 * Grooming Service
 * Calcula duraciones automáticas para citas grooming
 */

import { 
  Injectable, 
  BadRequestException, 
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Pet, Service, ServiceSizePrice } from '@/database/entities';
import { 
  DurationCalculation,
  ServiceDurationBreakdown,
} from '../dtos/grooming-duration.types';
import {
  findNearestSlot,
  formatMinutesToHuman,
  applyComboReductions,
} from '../utils/grooming-duration.utils';

@Injectable()
export class GroomingService {
  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
    
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,

    @InjectRepository(ServiceSizePrice)
    private serviceSizePriceRepository: Repository<ServiceSizePrice>,
  ) {}

  /**
   * Calcula la duración total de una cita grooming
   * @param petId ID de la mascota
   * @param serviceIds IDs de los servicios seleccionados
   * @returns Objeto con detalles del cálculo
   */
  async calculateGroomingDuration(
    petId: string,
    serviceIds: string[]
  ): Promise<DurationCalculation> {
    try {
      console.log('[GroomingService] Calculando duración:', { petId, serviceIds });

      // 1. Obtener mascota
      const pet = await this.petsRepository.findOne({ where: { id: petId } });
      if (!pet) {
        console.error(`[GroomingService] ❌ Mascota no encontrada: ${petId}`);
        throw new NotFoundException(`Mascota no encontrada: ${petId}`);
      }
      console.log(`[GroomingService] ✅ Mascota encontrada:`, { petId, name: pet.name, size: pet.size });

      // 2. Obtener servicios
      const services = await this.servicesRepository.find({
        where: { id: In(serviceIds) }
      });
      console.log(`[GroomingService] Servicios buscados: ${serviceIds.length} IDs, encontrados: ${services.length}`);
      services.forEach((s, idx) => {
        console.log(`  [${idx}] ${s.id}: "${s.name}", defaultDuration=${s.defaultDurationMinutes}min`);
      });

      if (!services || services.length === 0) {
        console.error(`[GroomingService] ❌ No se encontraron servicios para:`, serviceIds);
        throw new NotFoundException(`Servicios no encontrados para los IDs: ${serviceIds.join(', ')}`);
      }

      if (services.length !== serviceIds.length) {
        console.warn(`[GroomingService] ⚠️ Advertencia: se pidieron ${serviceIds.length} servicios pero solo se encontraron ${services.length}`);
      }

      const petSize = pet.size || 'M'; // Default MEDIUM
      console.log(`[GroomingService] ℹ️ Tamaño de mascota: ${petSize}`);

      // 3. Calcular duración de cada servicio
      // ✅ AHORA: Buscar en service_size_prices primero
      let servicesTotal = 0;
      const breakdown: ServiceDurationBreakdown[] = [];

      for (const service of services) {
        // Buscar duración específica para este servicio + tamaño en service_size_prices
        const sizePriceRecord = await this.serviceSizePriceRepository.findOne({
          where: {
            serviceId: service.id,
            petSize: petSize as any,
            priceListId: IsNull(), // Buscar el registro global (donde priceListId IS NULL)
          }
        });

        // Resolver duración: service_size_prices.durationMinutes → service.defaultDurationMinutes → 30
        let duration = 30; // Fallback máximo
        let durationSource = 'default fallback';

        if (sizePriceRecord?.durationMinutes) {
          duration = sizePriceRecord.durationMinutes;
          durationSource = `service_size_prices (${petSize})`;
        } else if (service.defaultDurationMinutes) {
          duration = service.defaultDurationMinutes;
          durationSource = 'service.defaultDurationMinutes';
        }

        console.log(`  → Servicio "${service.name}": ${duration}min (fuente: ${durationSource})`);

        breakdown.push({
          serviceId: service.id,
          serviceName: service.name,
          duration: duration,
          petSize: petSize,
        });

        servicesTotal += duration;
      }

      // 4. Aplicar reducciones por combos
      const serviceNames = breakdown.map(b => b.serviceName);
      const { reduction: comboReduction, appliedCombos } = applyComboReductions(
        serviceNames
      );
      console.log(`[GroomingService] Total antes de combos: ${servicesTotal}min, reduction: ${comboReduction}min, combos aplicados:`, appliedCombos);

      const calculatedDuration = servicesTotal - comboReduction;

      // 5. Redondear a slot
      const slot = findNearestSlot(calculatedDuration);
      console.log(`[GroomingService] ✅ Duración final: ${calculatedDuration}min → redondeado a ${slot.minutes}min (${slot.label})`);

      // 5. Retornar resultado
      return {
        servicesTotal,
        comboReduction,
        calculatedDuration,
        roundedDuration: slot.minutes,
        breakdown,
        appliedCombos,
        slot,
      };
    } catch (error) {
      console.error('[GroomingService] ❌ Error calculando duración:', error);
      throw error;
    }
  }

  /**
   * Obtiene información de duración para la UI (con textos formateados)
   */
  async getGroomingDurationInfo(
    petId: string,
    serviceIds: string[]
  ): Promise<{
    calculation: DurationCalculation;
    display: {
      breakdownText: string;
      totalText: string;
      slotLabel: string;
    };
  }> {
    const calculation = await this.calculateGroomingDuration(petId, serviceIds);

    // Generar textos para la UI
    const breakdownLines = calculation.breakdown.map(
      item => `${item.serviceName}: ${item.duration} min`
    );

    const breakdownText = breakdownLines.join('\n');
    const totalText = `${calculation.servicesTotal} min → -${calculation.comboReduction} min = ${calculation.calculatedDuration} min`;
    const slotLabel = calculation.slot.label;

    return {
      calculation,
      display: {
        breakdownText,
        totalText,
        slotLabel,
      },
    };
  }
}
