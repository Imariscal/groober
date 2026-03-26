import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClientAddress, GeocodeStatus } from '@/database/entities/client-address.entity';

@Injectable()
export class ClientAddressesRepository {
  constructor(
    @InjectRepository(ClientAddress)
    private readonly repository: Repository<ClientAddress>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Obtener todas las direcciones de un cliente en una clínica
   */
  async findByClientId(
    clinicId: string,
    clientId: string,
  ): Promise<ClientAddress[]> {
    return this.repository.find({
      where: {
        clinicId,
        clientId,
      },
      order: {
        isDefault: 'DESC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Obtener dirección default de un cliente
   */
  async findDefaultByClientId(
    clinicId: string,
    clientId: string,
  ): Promise<ClientAddress | null> {
    return this.repository.findOne({
      where: {
        clinicId,
        clientId,
        isDefault: true,
      },
    });
  }

  /**
   * Obtener una dirección por ID, validando clinic/client ownership
   */
  async findById(
    clinicId: string,
    clientId: string,
    addressId: string,
  ): Promise<ClientAddress | null> {
    return this.repository.findOne({
      where: {
        id: addressId,
        clinicId,
        clientId,
      },
    });
  }

  /**
   * Crear dirección - transacción para asegurar 1 default
   */
  async create(
    clinicId: string,
    clientId: string,
    data: Partial<ClientAddress>,
  ): Promise<ClientAddress> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Verificar si es la primera dirección
      const count = await queryRunner.manager.count(ClientAddress, {
        where: {
          clinicId,
          clientId,
        },
      });

      const isFirstAddress = count === 0;
      const shouldBeDefault = data.isDefault || isFirstAddress;

      // Si es default, desmarcar otras en misma transacción
      if (shouldBeDefault) {
        await queryRunner.manager.update(
          ClientAddress,
          {
            clinicId,
            clientId,
            isDefault: true,
          },
          {
            isDefault: false,
          },
        );
      }

      // Crear nueva dirección
      const address = this.repository.create({
        ...data,
        clinicId,
        clientId,
        isDefault: shouldBeDefault,
      });

      const created = await queryRunner.manager.save(address);
      await queryRunner.commitTransaction();

      return created;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Actualizar dirección - transacción para manejar cambios de default
   */
  async update(
    clinicId: string,
    clientId: string,
    addressId: string,
    data: Partial<ClientAddress>,
  ): Promise<ClientAddress> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Obtener dirección actual
      const address = await queryRunner.manager.findOne(ClientAddress, {
        where: {
          id: addressId,
          clinicId,
          clientId,
        },
      });

      if (!address) {
        throw new Error('Address not found');
      }

      // Si se marca como default, desmarcar las otras
      if (data.isDefault && !address.isDefault) {
        await queryRunner.manager.update(
          ClientAddress,
          {
            clinicId,
            clientId,
            isDefault: true,
          },
          {
            isDefault: false,
          },
        );
      }

      // Actualizar
      await queryRunner.manager.update(
        ClientAddress,
        {
          id: addressId,
        },
        data,
      );

      // Retornar actualizado
      const updated = await queryRunner.manager.findOne(ClientAddress, {
        where: {
          id: addressId,
        },
      });

      await queryRunner.commitTransaction();
      return updated!;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Eliminar dirección - si era default, marcar otra como default
   */
  async delete(
    clinicId: string,
    clientId: string,
    addressId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Obtener dirección a eliminar
      const address = await queryRunner.manager.findOne(ClientAddress, {
        where: {
          id: addressId,
          clinicId,
          clientId,
        },
      });

      if (!address) {
        throw new Error('Address not found');
      }

      const wasDefault = address.isDefault;

      // Eliminar
      await queryRunner.manager.delete(ClientAddress, {
        id: addressId,
      });

      // Si era default, marcar otra como default (más reciente)
      if (wasDefault) {
        const nextAddress = await queryRunner.manager.findOne(ClientAddress, {
          where: {
            clinicId,
            clientId,
          },
          order: {
            createdAt: 'DESC',
          },
        });

        if (nextAddress) {
          await queryRunner.manager.update(
            ClientAddress,
            {
              id: nextAddress.id,
            },
            {
              isDefault: true,
            },
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Set address as default - transacción
   */
  async setDefault(
    clinicId: string,
    clientId: string,
    addressId: string,
  ): Promise<ClientAddress> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Verificar que existe
      const address = await queryRunner.manager.findOne(ClientAddress, {
        where: {
          id: addressId,
          clinicId,
          clientId,
        },
      });

      if (!address) {
        throw new Error('Address not found');
      }

      // Desmarcar otras
      await queryRunner.manager.update(
        ClientAddress,
        {
          clinicId,
          clientId,
          isDefault: true,
        },
        {
          isDefault: false,
        },
      );

      // Marcar esta como default
      await queryRunner.manager.update(
        ClientAddress,
        {
          id: addressId,
        },
        {
          isDefault: true,
        },
      );

      const updated = await queryRunner.manager.findOne(ClientAddress, {
        where: {
          id: addressId,
        },
      });

      await queryRunner.commitTransaction();
      return updated!;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
