import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { CurrentUser } from '@/common/decorators';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { ClinicUsersService } from '../services/clinic-users.service';
import {
  CreateClinicUserDto,
  UpdateClinicUserDto,
  ClinicUserResponseDto,
  ListClinicUsersQueryDto,
} from '../dtos';

@Controller('clinics/:clinicId/users')
@UseGuards(AuthGuard, PermissionGuard)
export class ClinicUsersController {
  constructor(private readonly clinicUsersService: ClinicUsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('users:create')
  async createUser(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() dto: CreateClinicUserDto,
    @CurrentUser() currentUser: { id: string },
  ): Promise<ClinicUserResponseDto> {
    return this.clinicUsersService.createClinicUser(
      clinicId,
      dto,
      currentUser.id,
    );
  }

  @Get()
  @RequirePermission('users:read')
  async listUsers(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: ListClinicUsersQueryDto,
  ): Promise<ClinicUserResponseDto[]> {
    return this.clinicUsersService.listClinicUsers(clinicId, query);
  }

  @Get(':userId')
  @RequirePermission('users:read')
  async getUser(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ClinicUserResponseDto> {
    return this.clinicUsersService.getClinicUser(clinicId, userId);
  }

  @Put(':userId')
  @RequirePermission('users:update')
  async updateUser(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateClinicUserDto,
    @CurrentUser() currentUser: { id: string },
  ): Promise<ClinicUserResponseDto> {
    return this.clinicUsersService.updateClinicUser(
      clinicId,
      userId,
      dto,
      currentUser.id,
    );
  }

  @Put(':userId/deactivate')
  async deactivateUser(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: { id: string },
  ): Promise<ClinicUserResponseDto> {
    return this.clinicUsersService.deactivateUser(
      clinicId,
      userId,
      currentUser.id,
    );
  }
}
