import { Injectable } from '@nestjs/common';
import { PlatformClinicsService } from './platform-clinics.service';

@Injectable()
export class PlatformDashboardService {
  constructor(
    private clinicsService: PlatformClinicsService,
  ) {}

  /**
   * Get global platform dashboard KPIs
   * SuperAdmin only
   */
  async getDashboard() {
    const kpis = await this.clinicsService.getDashboardKPIs();

    return {
      timestamp: new Date().toISOString(),
      kpis: {
        total_clinics: kpis.total_clinics,
        active_clinics: kpis.active_clinics,
        suspended_clinics: kpis.suspended_clinics,
        statistics: {
          total_active_staff: kpis.sum_active_staff,
          total_active_clients: kpis.sum_active_clients,
          total_active_pets: kpis.sum_active_pets,
        },
      },
      recent_clinics: kpis.last_10_clinics.map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        phone: clinic.phone,
        email: clinic.email,
        city: clinic.city,
        country: clinic.country,
        subscriptionPlan: clinic.subscriptionPlan,
        status: clinic.status,
        maxStaffUsers: clinic.maxStaffUsers,
        maxClients: clinic.maxClients,
        maxPets: clinic.maxPets,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
      })),
    };
  }
}
