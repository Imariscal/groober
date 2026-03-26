import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PlatformUser, PlatformRole } from '../../database/entities';

export interface PlatformLoginDto {
  email: string;
  password: string;
}

export interface PlatformAuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    platform_roles: Array<{
      key: string;
      name: string;
    }>;
  };
}

@Injectable()
export class PlatformAuthService {
  constructor(
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
    @InjectRepository(PlatformRole)
    private platformRoleRepository: Repository<PlatformRole>,
    private jwtService: JwtService,
  ) {}

  async loginPlatform(
    loginDto: PlatformLoginDto,
  ): Promise<PlatformAuthResponseDto> {
    const user = await this.platformUserRepository.findOne({
      where: { email: loginDto.email },
      relations: ['platform_roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Email o contraseña inválidos');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email o contraseña inválidos');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('La cuenta de usuario está inactiva');
    }

    // Update last login
    user.last_login_at = new Date();
    await this.platformUserRepository.save(user);

    return this.generatePlatformTokens(user);
  }

  private generatePlatformTokens(user: PlatformUser): PlatformAuthResponseDto {
    // Collect all permissions from roles
    const permissions = new Set<string>();
    user.platform_roles.forEach((role) => {
      role.permissions.forEach((perm) => {
        permissions.add(perm);
      });
    });

    const payload = {
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
      platform_roles: user.platform_roles.map((r) => ({
        key: r.key,
        id: r.id,
      })),
      permissions: Array.from(permissions),
      is_platform_admin: true,
      clinic_id: null,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        platform_roles: user.platform_roles.map((r) => ({
          key: r.key,
          name: r.name,
        })),
      },
    };
  }
}
