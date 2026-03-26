import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PlatformUser, PlatformRole } from '@/database/entities';

export interface CreatePlatformUserDto {
  email: string;
  full_name: string;
  password: string;
}

export interface UpdatePlatformUserDto {
  full_name?: string;
  email?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

export interface ListPlatformUsersOptions {
  limit?: number;
  offset?: number;
  status?: string;
  role?: string;
  search?: string;
}

@Injectable()
export class PlatformUsersService {
  constructor(
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
    @InjectRepository(PlatformRole)
    private platformRoleRepository: Repository<PlatformRole>,
  ) {}

  async listUsers(options: ListPlatformUsersOptions) {
    const { limit = 20, offset = 0, status, role, search } = options;

    const queryBuilder = this.platformUserRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.platform_roles', 'roles')
      .take(limit)
      .skip(offset)
      .orderBy('user.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (role) {
      queryBuilder.andWhere('roles.name = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.full_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    // Calcular conteos
    const allUsers = await this.platformUserRepository.find();
    const counts = {
      total: allUsers.length,
      active: allUsers.filter((u) => u.status === 'ACTIVE').length,
      suspended: allUsers.filter((u) => u.status === 'SUSPENDED').length,
      deactivated: allUsers.filter((u) => u.status === 'DEACTIVATED').length,
    };

    return {
      users: users.map((user) => this.formatUser(user)),
      total,
      counts,
    };
  }

  async createUser(dto: CreatePlatformUserDto) {
    // Verificar si el correo ya existe
    const existingUser = await this.platformUserRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Obtener rol de super_admin automáticamente
    const superAdminRole = await this.platformRoleRepository.findOne({
      where: { key: 'super_admin' },
    });

    // Crear el usuario como superadmin
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.platformUserRepository.create({
      email: dto.email,
      full_name: dto.full_name,
      password_hash: passwordHash,
      status: 'ACTIVE',
      platform_roles: superAdminRole ? [superAdminRole] : [],
    });

    const savedUser = await this.platformUserRepository.save(user);
    return this.formatUser(savedUser);
  }

  async updateUser(id: string, dto: UpdatePlatformUserDto) {
    const user = await this.platformUserRepository.findOne({
      where: { id },
      relations: ['platform_roles'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar email único si se actualiza
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.platformUserRepository.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      user.email = dto.email;
    }

    if (dto.full_name) {
      user.full_name = dto.full_name;
    }

    if (dto.status) {
      user.status = dto.status;
      if (dto.status === 'DEACTIVATED') {
        user.deactivated_at = new Date();
      }
    }

    const savedUser = await this.platformUserRepository.save(user);
    return this.formatUser(savedUser);
  }

  async deleteUser(id: string) {
    const user = await this.platformUserRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.platformUserRepository.remove(user);
    return { message: 'Usuario eliminado correctamente' };
  }

  async getUserById(id: string) {
    const user = await this.platformUserRepository.findOne({
      where: { id },
      relations: ['platform_roles'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.formatUser(user);
  }

  async getRoles() {
    const roles = await this.platformRoleRepository.find();
    return roles.map((role) => ({
      id: role.id,
      name: role.key,
      display_name: role.name,
      description: role.description,
    }));
  }

  private formatUser(user: PlatformUser) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      status: user.status,
      roles: user.platform_roles?.map((r) => ({
        id: r.id,
        name: r.key,
        display_name: r.name,
      })) || [],
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
