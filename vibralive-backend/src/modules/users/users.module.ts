import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Clinic, Role, UserRole, Stylist, Veterinarian, Permission, RolePermission, ClinicConfiguration, StylistAvailability, VeterinarianAvailability } from '@/database/entities';
import { ClinicUsersController } from './controllers/clinic-users.controller';
import { RolesController } from './controllers/roles.controller';
import { ClinicUsersService } from './services/clinic-users.service';
import { RolesService } from './services/roles.service';
import { EmailModule } from '@/modules/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Clinic,
      Role,
      UserRole,
      Stylist,
      Veterinarian,
      Permission,
      RolePermission,
      ClinicConfiguration,
      StylistAvailability,
      VeterinarianAvailability,
    ]),
    EmailModule,
  ],
  controllers: [ClinicUsersController, RolesController],
  providers: [ClinicUsersService, RolesService],
  exports: [ClinicUsersService, RolesService],
})
export class UsersModule {}
