import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateClientDto } from '../dtos/create-client.dto';

@Injectable()
export class ClientValidator {
  validatePreferences(dto: CreateClientDto | Partial<CreateClientDto>): void {
    // Si do_not_contact es true, require reason
    if (dto.doNotContact && !dto.doNotContactReason?.trim()) {
      throw new BadRequestException(
        'La razón de no contactar es obligatoria cuando el toggle está activo'
      );
    }

    // Validar que el teléfono secundario no sea igual al principal ni al WhatsApp (si se ingresa)
    if (dto.phoneSecondary) {
      const normalizePhone = (p: string) => p.replace(/\D/g, '');
      const secondaryNorm = normalizePhone(dto.phoneSecondary);
      
      if (dto.phone && secondaryNorm === normalizePhone(dto.phone)) {
        throw new BadRequestException(
          'El teléfono secundario no puede ser igual al teléfono principal'
        );
      }
      
      if (dto.whatsappNumber && secondaryNorm === normalizePhone(dto.whatsappNumber)) {
        throw new BadRequestException(
          'El teléfono secundario no puede ser igual al WhatsApp'
        );
      }
    }

    // Validar time range
    if (dto.preferredContactTimeStart && dto.preferredContactTimeEnd) {
      const start = new Date(`2000-01-01T${dto.preferredContactTimeStart}`);
      const end = new Date(`2000-01-01T${dto.preferredContactTimeEnd}`);
      if (start >= end) {
        throw new BadRequestException(
          'La hora de inicio debe ser anterior a la hora de fin'
        );
      }
    }

    // Validar método contacto
    const validMethods = ['WHATSAPP', 'PHONE', 'EMAIL', 'SMS'];
    if (dto.preferredContactMethod && !validMethods.includes(dto.preferredContactMethod)) {
      throw new BadRequestException('El método de contacto es inválido');
    }

    // Validar housing type
    const validHouseTypes = ['HOUSE', 'APARTMENT', 'OTHER'];
    if (dto.housingType && !validHouseTypes.includes(dto.housingType)) {
      throw new BadRequestException('El tipo de vivienda es inválido');
    }

    // Validar status
    const validStatus = ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'BLACKLISTED'];
    if (dto.status && !validStatus.includes(dto.status)) {
      throw new BadRequestException('El estado del cliente es inválido');
    }
  }
}
