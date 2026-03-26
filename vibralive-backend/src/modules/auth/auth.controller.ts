import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PermissionService } from './services/permission.service';
import { LoginDto, RegisterDto, AcceptInvitationDto, AuthResponseDto } from './dtos/auth.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/database/entities';
import {
  getPermissionsByRole,
  FEATURES_BY_ROLE,
  UserRole,
} from './constants/roles-permissions.const';
import { RoleGuard } from '@/common/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  /**
   * Debug endpoint - Verifica que el backend está respondiendo
   */
  @Get('test')
  test() {
    return { 
      message: 'Backend está respondiendo correctamente',
      timestamp: new Date(),
      path: '/api/auth/login expect POST con { email, password }'
    };
  }

  /**
   * Login endpoint - Requiere email y contraseña
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const result = await this.authService.login(loginDto);
      return result;
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  /**
   * Register endpoint - Crear nueva clínica con propietario
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Accept invitation - Owner sets password and activates account
   * Returns JWT token for immediate authentication
   */
  @Post('accept-invitation')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
  ): Promise<AuthResponseDto> {
    return this.authService.acceptInvitation(dto);
  }

  /**
   * Register a new superadmin
   */
  @Post('register-superadmin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('superadmin')
  async registerSuperAdmin(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.registerSuperAdmin(registerDto);
  }

  /**
   * Get current user profile with permissions
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser() user: User) {
    // El user del guard solo tiene datos del JWT, necesitamos obtener el user completo desde la BD
    const fullUser = await this.authService.getUserById(user.id);

    if (!fullUser) {
      throw new Error('Usuario no encontrado');
    }

    // Load permissions from database (EHR + other permissions)
    const dbPermissions = await this.permissionService.getPermissionsByUserRole(fullUser.role);
    
    // Fall back to static permissions if database doesn't have any
    const permissions = dbPermissions.length > 0
      ? dbPermissions
      : getPermissionsByRole(fullUser.role as UserRole);
    
    const features = FEATURES_BY_ROLE[fullUser.role as UserRole];

    return {
      user: {
        id: fullUser.id,
        clinic_id: fullUser.clinicId,
        email: fullUser.email,
        name: fullUser.name,
        role: fullUser.role,
        status: fullUser.status,
        phone: fullUser.phone,
        address: fullUser.address,
        city: fullUser.city,
        postal_code: fullUser.postalCode,
        country: fullUser.country,
        permissions,
        available_features: features.modules,
        available_menu: features.menu,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Update current user profile
   */
  @Put('me')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateDto: any,
  ) {
    return this.authService.updateUserProfile(user.id, updateDto);
  }

  /**
   * Change current user password
   */
  @Put('me/password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User,
    @Body() passwordDto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changeUserPassword(user.id, passwordDto);
  }
}
