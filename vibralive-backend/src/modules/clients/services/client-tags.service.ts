import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientTag } from '@/database/entities/client-tag.entity';
import { Client } from '@/database/entities/client.entity';
import { ClientTagResponseDto } from '../dtos/client-tag.dto';

@Injectable()
export class ClientTagsService {
  constructor(
    @InjectRepository(ClientTag)
    private tagsRepository: Repository<ClientTag>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  /**
   * Obtener todos los tags de un cliente
   */
  async getClientTags(
    clientId: string,
    clinicId: string
  ): Promise<string[]> {
    // Verificar que el cliente pertenece a la clínica
    const client = await this.clientRepository.findOne({
      where: { id: clientId, clinicId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const tags = await this.tagsRepository.find({
      where: { clientId, clinicId },
      order: { createdAt: 'DESC' },
    });

    return tags.map(t => t.tag);
  }

  /**
   * Agregar un tag a un cliente
   */
  async addTag(
    clientId: string,
    clinicId: string,
    tag: string,
    user: any
  ): Promise<ClientTagResponseDto> {
    // Validar cliente
    const client = await this.clientRepository.findOne({
      where: { id: clientId, clinicId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Validar que el tag no esté vacío
    if (!tag || tag.trim().length === 0) {
      throw new BadRequestException('El tag no puede estar vacío');
    }

    if (tag.length > 50) {
      throw new BadRequestException('El tag no puede superar 50 caracteres');
    }

    // Verificar duplicado
    const existing = await this.tagsRepository.findOne({
      where: { clientId, clinicId, tag: tag.trim() },
    });

    if (existing) {
      throw new BadRequestException('Este tag ya existe para este cliente');
    }

    // Crear tag
    const newTag = this.tagsRepository.create({
      clientId,
      clinicId,
      tag: tag.trim(),
    });

    const saved = await this.tagsRepository.save(newTag);

    return {
      id: saved.id,
      clientId: saved.clientId,
      tag: saved.tag,
      createdAt: saved.createdAt,
    };
  }

  /**
   * Remover un tag de un cliente
   */
  async removeTag(
    clientId: string,
    clinicId: string,
    tag: string,
    user: any
  ): Promise<void> {
    // Verificar que el cliente pertenece a la clínica
    const client = await this.clientRepository.findOne({
      where: { id: clientId, clinicId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const result = await this.tagsRepository.delete({
      clientId,
      clinicId,
      tag,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Tag no encontrado');
    }
  }

  /**
   * Obtener clientes por tag (para reportes/segmentación)
   */
  async getClientsByTag(
    clinicId: string,
    tag: string
  ): Promise<Client[]> {
    const tags = await this.tagsRepository.find({
      where: { clinicId, tag },
      relations: ['client'],
    });

    return tags.map(t => t.client);
  }

  /**
   * Buscar tags por patrón (autocomplete)
   */
  async searchTags(
    clinicId: string,
    pattern: string,
    limit: number = 10
  ): Promise<string[]> {
    const tags = await this.tagsRepository
      .createQueryBuilder('ct')
      .where('ct.clinic_id = :clinicId', { clinicId })
      .andWhere('ct.tag ILIKE :pattern', { pattern: `%${pattern}%` })
      .select('DISTINCT ct.tag', 'tag')
      .orderBy('ct.tag', 'ASC')
      .limit(limit)
      .getRawMany();

    return tags.map(t => t.tag);
  }
}
