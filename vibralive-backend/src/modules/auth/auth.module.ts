import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User, Clinic, Role, RolePermission, Permission } from '@/database/entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PermissionGuard } from './guards/permission.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionService } from './services/permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Clinic, Role, RolePermission, Permission]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PermissionGuard, JwtStrategy, PermissionService],
  exports: [AuthService, PermissionGuard, PermissionService],
})
export class AuthModule {}
