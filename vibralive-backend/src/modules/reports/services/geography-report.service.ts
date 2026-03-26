import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../../database/entities/client.entity';
import { ClientAddress } from '../../../database/entities/client-address.entity';
import { Appointment } from '../../../database/entities/appointment.entity';
import { AppointmentItem } from '../../../database/entities/appointment-item.entity';
import { ClinicConfiguration } from '../../../database/entities/clinic-configuration.entity';
import { GeographyReportResponse, ReportQueryParams, LocationData } from '../dto/reports.dto';
import { ReportsService } from './reports.service';

@Injectable()
export class GeographyReportService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientAddress)
    private clientAddressRepository: Repository<ClientAddress>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentItem)
    private appointmentItemRepository: Repository<AppointmentItem>,
    @InjectRepository(ClinicConfiguration)
    private clinicConfigRepository: Repository<ClinicConfiguration>,
    @Inject(ReportsService)
    private reportsService: ReportsService,
  ) {}

  async generate(params: ReportQueryParams): Promise<GeographyReportResponse> {
    const period = params.period || 'month';
    const { startDate, endDate } = this.reportsService.getNormalizeDateRange(period);
    const clinicId = params.clinicId;

    console.log('=== Geography Report Generation ===');
    console.log('Period:', period, 'Date range:', { startDate, endDate });

    try {
      const [heatmapData, zoneData, zonesCovered, hottestZone, homeAppointmentsOmitted, clinicConfig] = await Promise.all([
        this.getHeatmapData(clinicId, startDate, endDate),
        this.getZoneData(clinicId, startDate, endDate),
        this.getZonesCovered(clinicId, startDate, endDate),
        this.getHottestZone(clinicId, startDate, endDate),
        this.getHomeAppointmentsOmitted(clinicId, startDate, endDate),
        this.clinicConfigRepository.findOne({ where: { clinicId } }),
      ]);

      const totalAppointments = heatmapData.reduce((acc, loc) => acc + loc.appointmentCount, 0);
      const avgAppointmentsPerZone = zoneData.length > 0 ? Math.round(totalAppointments / zoneData.length) : 0;

      return {
        kpis: {
          zonesCovered: {
            label: 'Zonas Cubiertas',
            value: `${zonesCovered} zonas`,
            trending: '✓ Cobertura activa',
          },
          hottest: {
            label: 'Zona de mayor demanda',
            value: hottestZone.zone || 'Sin datos',
            trending: `${hottestZone.appointments || 0} citas`,
          },
          clientsPerZone: {
            label: 'Clientes promedio/zona',
            value: zoneData.length > 0 ? `${(zoneData.reduce((acc, z) => acc + z.clientCount, 0) / zoneData.length).toFixed(0)}` : '0',
            trending: 'Distribución geográfica',
          },
          citiesDensity: {
            label: 'Citas por cliente',
            value: zoneData.length > 0 ? `${(totalAppointments / Math.max(1, zoneData.reduce((acc, z) => acc + z.clientCount, 0))).toFixed(2)}` : '0',
            trending: 'Ratio de lealtad',
          },
        },
        charts: {
          heatmap: heatmapData,
        },
        zones: zoneData,
        metadata: {
          period: period,
          city: 'Análisis geográfico',
          lastUpdated: new Date(),
          homeAppointmentsOmitted,
          homeAppointmentsMessage: homeAppointmentsOmitted > 0 ? `${homeAppointmentsOmitted} citas a domicilio omitidas (sin domicilios verificados)` : 'Todos los domicilios verificados',
          mapCenterLat: clinicConfig?.baseLat ?? null,
          mapCenterLng: clinicConfig?.baseLng ?? null,
        },
      };
    } catch (error) {
      console.error('Error generating geography report:', error);
      throw error;
    }
  }

  private async getHeatmapData(clinicId: string, startDate: Date, endDate: Date): Promise<LocationData[]> {
    // Get appointments with their real coordinates from client addresses (CLINIC type only)
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('client_address.lat', 'latitude')
      .addSelect('client_address.lng', 'longitude')
      .addSelect('client_address.city', 'city')
      .addSelect('client_address.state', 'state')
      .addSelect('COUNT(appointment.id)', 'appointmentCount')
      .leftJoin(ClientAddress, 'client_address', 'client_address.id = appointment.addressId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .andWhere('appointment.locationType = :locationType', { locationType: 'HOME' })
      .andWhere('client_address.lat IS NOT NULL')
      .andWhere('client_address.lng IS NOT NULL')
      .groupBy('client_address.lng, client_address.lat, client_address.city, client_address.state')
      .orderBy('COUNT(appointment.id)', 'DESC')
      .limit(100)
      .getRawMany();

    // Convert results to heatmap format
    const locations = result.map((r) => {
      const appointmentCount = parseInt(r.appointmentCount, 10);
      const zone = r.city ? `${r.city}, ${r.state}` : 'Sin dirección';
      const latitude = parseFloat(r.latitude);
      const longitude = parseFloat(r.longitude);

      // Validate coordinates are within reasonable ranges
      if (isNaN(latitude) || isNaN(longitude)) {
        return null;
      }

      return {
        lat: latitude,
        lng: longitude,
        weight: appointmentCount,
        zone: zone,
        appointmentCount: appointmentCount,
      };
    }).filter((loc): loc is LocationData => loc !== null);

    return locations;
  }

  private async getZoneData(clinicId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('client_address.city', 'zone')
      .addSelect('client_address.state', 'state')
      .addSelect('COUNT(DISTINCT appointment.clientId)', 'clientCount')
      .addSelect('COUNT(appointment.id)', 'appointmentCount')
      .addSelect('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'totalRevenue')
      .leftJoin(ClientAddress, 'client_address', 'client_address.id = appointment.addressId')
      .leftJoin(AppointmentItem, 'item', 'item.appointmentId = appointment.id')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .andWhere('appointment.locationType = :locationType', { locationType: 'HOME' })
      .andWhere('client_address.lat IS NOT NULL')
      .andWhere('client_address.lng IS NOT NULL')
      .groupBy('client_address.city, client_address.state')
      .orderBy('COUNT(appointment.id)', 'DESC')
      .limit(50)
      .getRawMany();

    return result.map((r) => ({
      zone: r.state ? `${r.zone}, ${r.state}` : r.zone || 'Sin dirección',
      clientCount: parseInt(r.clientCount, 10),
      appointmentCount: parseInt(r.appointmentCount, 10),
      totalRevenue: parseFloat(r.totalRevenue || 0),
      appointmentsPerClient: (parseInt(r.appointmentCount, 10) / Math.max(1, parseInt(r.clientCount, 10))).toFixed(2),
    }));
  }

  private async getZonesCovered(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(DISTINCT client_address.city)', 'count')
      .leftJoin(ClientAddress, 'client_address', 'client_address.id = appointment.addressId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .andWhere('appointment.locationType = :locationType', { locationType: 'HOME' })
      .andWhere('client_address.lat IS NOT NULL')
      .andWhere('client_address.lng IS NOT NULL')
      .getRawOne();

    return parseInt(result?.count || 0, 10);
  }

  private async getHottestZone(clinicId: string, startDate: Date, endDate: Date): Promise<{ zone: string; appointments: number }> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('client_address.city', 'zone')
      .addSelect('COUNT(appointment.id)', 'appointmentCount')
      .leftJoin(ClientAddress, 'client_address', 'client_address.id = appointment.addressId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .andWhere('appointment.locationType = :locationType', { locationType: 'HOME' })
      .andWhere('client_address.lat IS NOT NULL')
      .andWhere('client_address.lng IS NOT NULL')
      .groupBy('client_address.city')
      .orderBy('COUNT(appointment.id)', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      zone: result?.zone || 'Sin datos',
      appointments: parseInt(result?.appointmentCount || 0, 10),
    };
  }

  private async getHomeAppointmentsOmitted(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Count HOME appointments that were omitted (no verified address with lat/lng)
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'count')
      .leftJoin(ClientAddress, 'client_address', 'client_address.id = appointment.addressId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .andWhere('appointment.locationType = :locationType', { locationType: 'HOME' })
      .andWhere('(client_address.lat IS NULL OR client_address.lng IS NULL)')
      .getRawOne();

    return parseInt(result?.count || 0, 10);
  }
}
