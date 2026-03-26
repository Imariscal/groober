import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '@/database/entities/client.entity';
import { ClientAddress, GeocodeStatus } from '@/database/entities/client-address.entity';
import { ClientAddressesRepository } from './repositories';
import {
  CreateClientAddressDto,
  UpdateClientAddressDto,
  ClientAddressResponseDto,
} from './dtos';

@Injectable()
export class ClientAddressesService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private addressesRepository: ClientAddressesRepository,
  ) {}

  /**
   * Obtener todas las direcciones de un cliente
   */
  async getClientAddresses(
    clinicId: string,
    clientId: string,
  ): Promise<ClientAddressResponseDto[]> {
    // Validar que cliente pertenece a la clínica
    await this.validateClientOwnership(clinicId, clientId);

    const addresses = await this.addressesRepository.findByClientId(
      clinicId,
      clientId,
    );

    return addresses.map((addr) => this.mapToResponseDto(addr));
  }

  /**
   * Crear nueva dirección
   */
  async createAddress(
    clinicId: string,
    clientId: string,
    createDto: CreateClientAddressDto,
  ): Promise<ClientAddressResponseDto> {
    // Validar que cliente pertenece a la clínica
    await this.validateClientOwnership(clinicId, clientId);

    // Validar que la dirección tenga al menos lat/lng o ser PENDING
    if (!createDto.street || !createDto.city) {
      throw new BadRequestException(
        'Street and city are required for an address',
      );
    }

    const data: Partial<ClientAddress> = {
      label: createDto.label,
      street: createDto.street,
      numberExt: createDto.number_ext,
      numberInt: createDto.number_int,
      neighborhood: createDto.neighborhood,
      city: createDto.city,
      state: createDto.state,
      zipCode: createDto.zip_code,
      references: createDto.references,
      lat: createDto.lat,
      lng: createDto.lng,
      geocodeStatus: createDto.lat && createDto.lng ? GeocodeStatus.OK : GeocodeStatus.PENDING,
      isDefault: false, // Lo manejará el repository
    };

    const address = await this.addressesRepository.create(
      clinicId,
      clientId,
      data,
    );

    return this.mapToResponseDto(address);
  }

  /**
   * Actualizar dirección
   */
  async updateAddress(
    clinicId: string,
    clientId: string,
    addressId: string,
    updateDto: UpdateClientAddressDto,
  ): Promise<ClientAddressResponseDto> {
    // Validar que cliente pertenece a la clínica
    await this.validateClientOwnership(clinicId, clientId);

    // Validar que dirección existe y pertenece al cliente
    await this.validateAddressOwnership(clinicId, clientId, addressId);

    const data: Partial<ClientAddress> = {};

    if (updateDto.label !== undefined) data.label = updateDto.label;
    if (updateDto.street !== undefined) data.street = updateDto.street;
    if (updateDto.number_ext !== undefined) data.numberExt = updateDto.number_ext;
    if (updateDto.number_int !== undefined) data.numberInt = updateDto.number_int;
    if (updateDto.neighborhood !== undefined)
      data.neighborhood = updateDto.neighborhood;
    if (updateDto.city !== undefined) data.city = updateDto.city;
    if (updateDto.state !== undefined) data.state = updateDto.state;
    if (updateDto.zip_code !== undefined) data.zipCode = updateDto.zip_code;
    if (updateDto.references !== undefined) data.references = updateDto.references;
    if (updateDto.lat !== undefined) data.lat = updateDto.lat;
    if (updateDto.lng !== undefined) data.lng = updateDto.lng;
    if (updateDto.is_default !== undefined) data.isDefault = updateDto.is_default;

    // Actualizar geocode_status si se proporcionan coords
    if (updateDto.lat !== undefined || updateDto.lng !== undefined) {
      data.geocodeStatus = updateDto.lat && updateDto.lng ? GeocodeStatus.OK : GeocodeStatus.PENDING;
    }

    const address = await this.addressesRepository.update(
      clinicId,
      clientId,
      addressId,
      data,
    );

    return this.mapToResponseDto(address);
  }

  /**
   * Eliminar dirección
   */
  async deleteAddress(
    clinicId: string,
    clientId: string,
    addressId: string,
  ): Promise<void> {
    // Validar que cliente pertenece a la clínica
    await this.validateClientOwnership(clinicId, clientId);

    // Validar que dirección existe y pertenece al cliente
    await this.validateAddressOwnership(clinicId, clientId, addressId);

    // Validar que no es la última dirección del cliente
    const addresses = await this.addressesRepository.findByClientId(clinicId, clientId);
    if (addresses.length <= 1) {
      throw new BadRequestException('No se puede eliminar la última dirección del cliente');
    }

    await this.addressesRepository.delete(clinicId, clientId, addressId);
  }

  /**
   * Marcar dirección como default
   */
  async setDefaultAddress(
    clinicId: string,
    clientId: string,
    addressId: string,
  ): Promise<ClientAddressResponseDto> {
    // Validar que cliente pertenece a la clínica
    await this.validateClientOwnership(clinicId, clientId);

    // Validar que dirección existe y pertenece al cliente
    await this.validateAddressOwnership(clinicId, clientId, addressId);

    const address = await this.addressesRepository.setDefault(
      clinicId,
      clientId,
      addressId,
    );

    return this.mapToResponseDto(address);
  }

  /**
   * Privados
   */

  private async validateClientOwnership(
    clinicId: string,
    clientId: string,
  ): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: {
        id: clientId,
        clinicId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found in this clinic');
    }
  }

  private async validateAddressOwnership(
    clinicId: string,
    clientId: string,
    addressId: string,
  ): Promise<void> {
    const address = await this.addressesRepository.findById(
      clinicId,
      clientId,
      addressId,
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }
  }

  private mapToResponseDto(address: ClientAddress): ClientAddressResponseDto {
    return {
      id: address.id,
      clinic_id: address.clinicId,
      client_id: address.clientId,
      label: address.label,
      street: address.street,
      number_ext: address.numberExt,
      number_int: address.numberInt,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.zipCode,
      references: address.references,
      lat: address.lat,
      lng: address.lng,
      geocode_status: address.geocodeStatus,
      is_default: address.isDefault,
      created_at: address.createdAt,
      updated_at: address.updatedAt,
    };
  }
}
