import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AppointmentItem } from '@/database/entities';

@Injectable()
export class AppointmentItemRepository extends Repository<AppointmentItem> {
  constructor(private dataSource: DataSource) {
    super(AppointmentItem, dataSource.createEntityManager());
  }

  async createAppointmentItem(
    clinicId: string,
    appointmentId: string,
    serviceId?: string,
    packageId?: string,
    priceAtBooking: number = 0,
    quantity: number = 1
  ): Promise<AppointmentItem> {
    const subtotal = priceAtBooking * quantity;
    const item = this.create({
      clinicId,
      appointmentId,
      serviceId,
      packageId,
      priceAtBooking,
      quantity,
      subtotal,
    });
    return this.save(item);
  }

  async getAppointmentItems(appointmentId: string): Promise<AppointmentItem[]> {
    return this.find({
      where: { appointmentId },
      relations: ['service', 'package'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAppointmentTotal(appointmentId: string): Promise<number> {
    const result = await this.createQueryBuilder('item')
      .select('SUM(item.subtotal)', 'total')
      .where('item.appointmentId = :appointmentId', { appointmentId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  async deleteByAppointmentId(appointmentId: string): Promise<void> {
    await this.delete({ appointmentId });
  }
}

