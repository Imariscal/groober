import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { MedicalVisitsService } from './services/medical-visits.service';
import {
  CreateMedicalVisitDto,
  AddDiagnosisDto,
  CreatePrescriptionDto,
  CreateVaccinationDto,
  CreateMedicationAllergyDto,
  CreateDiagnosticOrderDto,
  SignMedicalRecordDto,
  CreateFollowUpNoteDto,
  UpdateFollowUpNoteDto,
  CreateMedicalProcedureDto,
  UpdateMedicalProcedureDto,
} from './dtos';

@Controller('medical-visits')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class MedicalVisitsController {
  constructor(private readonly medicalVisitsService: MedicalVisitsService) {}

  // ====================================================================
  // MEDICAL VISITS
  // ====================================================================

  /**
   * POST /medical-visits
   * Crear nueva visita médica
   */
  @Post()
  @HttpCode(201)
  @RequirePermission('ehr:medical_history:create')
  async createMedicalVisit(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateMedicalVisitDto,
  ) {
    return this.medicalVisitsService.create(clinicId, dto, user.id);
  }

  /**
   * GET /medical-visits/medications
   * Obtener medicamentos únicos prescritos (para autocomplete)
   */
  @Get('medications')
  @RequirePermission('ehr:prescriptions:read')
  async getUniqueMedications(@CurrentClinicId() clinicId: string) {
    return this.medicalVisitsService.getUniqueMedications(clinicId);
  }

  /**
   * GET /medical-visits/medications/most-used
   * Obtener medicamentos más usados recientemente
   */
  @Get('medications/most-used')
  @RequirePermission('ehr:prescriptions:read')
  async getMostUsedMedications(
    @CurrentClinicId() clinicId: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.medicalVisitsService.getMostUsedMedications(
      clinicId,
      parseInt(limit, 10),
    );
  }

  /**
   * GET /medical-visits/pet/:petId
   * Obtener todas las visitas médicas de una mascota
   */
  @Get('pet/:petId')
  @RequirePermission('ehr:medical_history:read')
  async getMedicalHistory(
    @CurrentClinicId() clinicId: string,
    @Param('petId') petId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return this.medicalVisitsService.findByPet(
      clinicId,
      petId,
      parseInt(limit),
      parseInt(offset),
    );
  }

  /**
   * GET /medical-visits/:id
   * Obtener una visita médica
   */
  @Get(':id')
  @RequirePermission('ehr:medical_history:read')
  async getMedicalVisit(
    @CurrentClinicId() clinicId: string,
    @Param('id') medicalVisitId: string,
  ) {
    return this.medicalVisitsService.findOne(clinicId, medicalVisitId);
  }

  /**
   * PUT /medical-visits/:id
   * Actualizar visita médica (solo si está en DRAFT)
   */
  @Put(':id')
  @RequirePermission('ehr:medical_history:update')
  async updateMedicalVisit(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Param('id') medicalVisitId: string,
    @Body() dto: Partial<CreateMedicalVisitDto>,
  ) {
    return this.medicalVisitsService.update(clinicId, medicalVisitId, dto, user.id);
  }

  /**
   * PATCH /medical-visits/:id/status
   * Cambiar estado de visita médica
   */
  @Patch(':id/status')
  @RequirePermission('ehr:medical_history:update')
  async updateStatus(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Param('id') medicalVisitId: string,
    @Body('status') status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED',
    @Body('signedByVeterinarianId') signedByVeterinarianId?: string,
  ) {
    return this.medicalVisitsService.updateStatus(
      clinicId,
      medicalVisitId,
      status,
      user.id,
      signedByVeterinarianId,
    );
  }

  /**
   * POST /medical-visits/:id/sign
   * Firmar registro médico (solo veterinarios)
   */
  @Post(':id/sign')
  @HttpCode(200)
  @RequirePermission('ehr:signatures:create')
  async signMedicalRecord(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Param('id') medicalVisitId: string,
    @Body() dto: SignMedicalRecordDto,
  ) {
    return this.medicalVisitsService.signMedicalRecord(
      clinicId,
      medicalVisitId,
      dto,
      user.id,
    );
  }

  // ====================================================================
  // DIAGNOSES
  // ====================================================================

  /**
   * POST /medical-visits/:visitId/diagnoses
   * Agregar diagnóstico a una visita
   */
  @Post(':visitId/diagnoses')
  @HttpCode(201)
  @RequirePermission('ehr:diagnostics:create')
  async addDiagnosis(
    @CurrentClinicId() clinicId: string,
    @Param('visitId') visitId: string,
    @Body() dto: AddDiagnosisDto,
  ) {
    return this.medicalVisitsService.addDiagnosis(clinicId, visitId, dto);
  }

  /**
   * GET /medical-visits/:visitId/diagnoses
   * Obtener diagnósticos de una visita
   */
  @Get(':visitId/diagnoses')
  @RequirePermission('ehr:diagnostics:read')
  async getDiagnoses(
    @CurrentClinicId() clinicId: string,
    @Param('visitId') visitId: string,
  ) {
    return this.medicalVisitsService.getDiagnosesByVisit(clinicId, visitId);
  }

  // ====================================================================
  // PRESCRIPTIONS
  // ====================================================================

  /**
   * POST /medical-visits/:visitId/prescriptions
   * Crear receta
   */
  @Post(':visitId/prescriptions')
  @HttpCode(201)
  @RequirePermission('ehr:prescriptions:create')
  async createPrescription(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Param('visitId') visitId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.medicalVisitsService.createPrescription(
      clinicId,
      visitId,
      dto,
      user.id,
    );
  }

  /**
   * GET /medical-visits/pet/:petId/prescriptions
   * Obtener recetas activas de una mascota
   */
  @Get('pet/:petId/prescriptions')
  @RequirePermission('ehr:prescriptions:read')
  async getActivePrescriptions(
    @CurrentClinicId() clinicId: string,
    @Param('petId') petId: string,
  ) {
    return this.medicalVisitsService.getActivePrescriptions(clinicId, petId);
  }

  /**
   * PUT /medical-visits/prescriptions/:prescriptionId
   * Actualizar receta
   */
  @Put('prescriptions/:prescriptionId')
  @RequirePermission('ehr:prescriptions:update')
  async updatePrescription(
    @CurrentClinicId() clinicId: string,
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: Partial<CreatePrescriptionDto>,
  ) {
    return this.medicalVisitsService.updatePrescription(clinicId, prescriptionId, dto);
  }

  /**
   * DELETE /medical-visits/prescriptions/:prescriptionId
   * Eliminar receta
   */
  @Delete('prescriptions/:prescriptionId')
  @RequirePermission('ehr:prescriptions:update')
  async deletePrescription(
    @CurrentClinicId() clinicId: string,
    @Param('prescriptionId') prescriptionId: string,
  ) {
    await this.medicalVisitsService.deletePrescription(clinicId, prescriptionId);
  }

  // ====================================================================
  // VACCINATIONS
  // ====================================================================

  /**
   * POST /medical-visits/vaccinations
   * Registrar vacunación
   */
  @Post('vaccinations')
  @HttpCode(201)
  @RequirePermission('ehr:vaccinations:create')
  async recordVaccination(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateVaccinationDto,
  ) {
    return this.medicalVisitsService.recordVaccination(clinicId, dto, user.id);
  }

  /**
   * GET /medical-visits/pet/:petId/vaccinations
   * Obtener cronograma de vacunaciones
   */
  @Get('pet/:petId/vaccinations')
  @RequirePermission('ehr:vaccinations:read')
  async getVaccinationSchedule(
    @CurrentClinicId() clinicId: string,
    @Param('petId') petId: string,
  ) {
    return this.medicalVisitsService.getVaccinationSchedule(clinicId, petId);
  }

  /**
   * GET /medical-visits/pet/:petId/vaccinations/overdue
   * Obtener vacunas vencidas/próximas a vencer
   */
  @Get('pet/:petId/vaccinations/overdue')
  @RequirePermission('ehr:vaccinations:read')
  async getOverdueVaccinations(
    @CurrentClinicId() clinicId: string,
    @Param('petId') petId: string,
  ) {
    return this.medicalVisitsService.getOverdueVaccinations(clinicId, petId);
  }

  /**
   * PUT /medical-visits/vaccinations/:vaccinationId
   * Actualizar vacunación
   */
  @Put('vaccinations/:vaccinationId')
  @RequirePermission('ehr:vaccinations:update')
  async updateVaccination(
    @CurrentClinicId() clinicId: string,
    @Param('vaccinationId') vaccinationId: string,
    @Body() dto: Partial<CreateVaccinationDto>,
  ) {
    return this.medicalVisitsService.updateVaccination(clinicId, vaccinationId, dto);
  }

  /**
   * DELETE /medical-visits/vaccinations/:vaccinationId
   * Eliminar vacunación
   */
  @Delete('vaccinations/:vaccinationId')
  @RequirePermission('ehr:vaccinations:update')
  async deleteVaccination(
    @CurrentClinicId() clinicId: string,
    @Param('vaccinationId') vaccinationId: string,
  ) {
    await this.medicalVisitsService.deleteVaccination(clinicId, vaccinationId);
  }

  // ====================================================================
  // MEDICATION ALLERGIES
  // =====================================================================

  /**
   * POST /medical-visits/allergies
   * Registrar alergia a medicamento
   */
  @Post('allergies')
  @HttpCode(201)
  @RequirePermission('ehr:allergies:create')
  async recordAllergy(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateMedicationAllergyDto,
  ) {
    return this.medicalVisitsService.recordMedicationAllergy(
      clinicId,
      dto,
      user.id,
    );
  }

  /**
   * GET /medical-visits/pet/:petId/allergies
   * Obtener alergias de una mascota
   */
  @Get('pet/:petId/allergies')
  @RequirePermission('ehr:allergies:read')
  async getAllergies(
    @CurrentClinicId() clinicId: string,
    @Param('petId') petId: string,
  ) {
    return this.medicalVisitsService.getAllergies(clinicId, petId);
  }

  /**
   * PUT /medical-visits/allergies/:allergyId
   * Actualizar alergia a medicamento
   */
  @Put('allergies/:allergyId')
  @RequirePermission('ehr:allergies:update')
  async updateAllergy(
    @CurrentClinicId() clinicId: string,
    @Param('allergyId') allergyId: string,
    @Body() dto: Partial<CreateMedicationAllergyDto>,
  ) {
    return this.medicalVisitsService.updateAllergy(clinicId, allergyId, dto);
  }

  /**
   * DELETE /medical-visits/allergies/:allergyId
   * Eliminar alergia a medicamento
   */
  @Delete('allergies/:allergyId')
  @RequirePermission('ehr:allergies:update')
  async deleteAllergy(
    @CurrentClinicId() clinicId: string,
    @Param('allergyId') allergyId: string,
  ) {
    await this.medicalVisitsService.deleteAllergy(clinicId, allergyId);
  }

  // ====================================================================
  // DIAGNOSTIC ORDERS
  // ====================================================================

  /**
   * POST /medical-visits/:medicalVisitId/diagnostic-orders
   * Crear orden de diagnóstico
   */
  @Post(':medicalVisitId/diagnostic-orders')
  @HttpCode(201)
  @RequirePermission('ehr:diagnostics:create')
  async createDiagnosticOrder(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Param('medicalVisitId') medicalVisitId: string,
    @Body() dto: CreateDiagnosticOrderDto,
  ) {
    return this.medicalVisitsService.createDiagnosticOrder(
      clinicId,
      medicalVisitId,
      dto,
      user.id,
    );
  }

  /**
   * GET /medical-visits/:medicalVisitId/diagnostic-orders
   * Obtener órdenes de diagnóstico de una visita médica
   */
  @Get(':medicalVisitId/diagnostic-orders')
  @RequirePermission('ehr:diagnostics:read')
  async getDiagnosticOrders(
    @CurrentClinicId() clinicId: string,
    @Param('medicalVisitId') medicalVisitId: string,
  ) {
    return this.medicalVisitsService.getDiagnosticOrders(clinicId, medicalVisitId);
  }

  /**
   * PATCH /medical-visits/diagnostic-orders/:orderId/mark-sample-collected
   * Marcar muestra como recolectada
   */
  @Patch('diagnostic-orders/:orderId/mark-sample-collected')
  @RequirePermission('ehr:diagnostics:update')
  async markSampleCollected(
    @CurrentClinicId() clinicId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.medicalVisitsService.markSampleCollected(clinicId, orderId);
  }

  /**
   * PATCH /medical-visits/diagnostic-orders/:orderId/complete
   * Marcar orden como completada
   */
  @Patch('diagnostic-orders/:orderId/complete')
  @RequirePermission('ehr:diagnostics:update')
  async completeOrder(
    @CurrentClinicId() clinicId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.medicalVisitsService.completeOrder(clinicId, orderId);
  }

  /**
   * PUT /medical-visits/diagnostic-orders/:orderId
   * Actualizar orden de diagnóstico
   */
  @Put('diagnostic-orders/:orderId')
  @RequirePermission('ehr:diagnostic_orders:update')
  async updateDiagnosticOrder(
    @CurrentClinicId() clinicId: string,
    @Param('orderId') orderId: string,
    @Body() dto: Partial<CreateDiagnosticOrderDto>,
  ) {
    return this.medicalVisitsService.updateDiagnosticOrder(clinicId, orderId, dto);
  }

  /**
   * DELETE /medical-visits/diagnostic-orders/:orderId
   * Eliminar orden de diagnóstico
   */
  @Delete('diagnostic-orders/:orderId')
  @RequirePermission('ehr:diagnostic_orders:update')
  async deleteDiagnosticOrder(
    @CurrentClinicId() clinicId: string,
    @Param('orderId') orderId: string,
  ) {
    await this.medicalVisitsService.deleteDiagnosticOrder(clinicId, orderId);
  }

  // ====================================================================
  // PROCEDURES
  // ====================================================================

  /**
   * POST /medical-visits/:medicalVisitId/procedures
   * Crear procedimiento médico
   */
  @Post(':medicalVisitId/procedures')
  @HttpCode(201)
  @RequirePermission('ehr:procedures:create')
  async createProcedure(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Param('medicalVisitId') medicalVisitId: string,
    @Body() dto: CreateMedicalProcedureDto,
  ) {
    return this.medicalVisitsService.createProcedure(
      clinicId,
      medicalVisitId,
      dto,
      user.id,
    );
  }

  /**
   * PUT /medical-visits/procedures/:procedureId
   * Actualizar procedimiento
   */
  @Put('procedures/:procedureId')
  @RequirePermission('ehr:procedures:update')
  async updateProcedure(
    @CurrentClinicId() clinicId: string,
    @Param('procedureId') procedureId: string,
    @Body() dto: UpdateMedicalProcedureDto,
  ) {
    return this.medicalVisitsService.updateProcedure(clinicId, procedureId, dto);
  }

  /**
   * DELETE /medical-visits/procedures/:procedureId
   * Eliminar procedimiento
   */
  @Delete('procedures/:procedureId')
  @HttpCode(204)
  @RequirePermission('ehr:procedures:update')
  async deleteProcedure(
    @CurrentClinicId() clinicId: string,
    @Param('procedureId') procedureId: string,
  ) {
    await this.medicalVisitsService.deleteProcedure(clinicId, procedureId);
  }

  // ====================================================================
  // FOLLOW-UP NOTES
  // ====================================================================

  /**
   * POST /medical-visits/:medicalVisitId/follow-up-notes
   * Crear nota de seguimiento
   */
  @Post(':medicalVisitId/follow-up-notes')
  @HttpCode(201)
  @RequirePermission('ehr:follow_ups:create')
  async createFollowUpNote(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Param('medicalVisitId') medicalVisitId: string,
    @Body() dto: CreateFollowUpNoteDto,
  ) {
    return this.medicalVisitsService.createFollowUpNote(
      clinicId,
      medicalVisitId,
      dto,
      user.id,
    );
  }

  /**
   * PUT /medical-visits/follow-up-notes/:noteId
   * Actualizar nota de seguimiento
   */
  @Put('follow-up-notes/:noteId')
  @RequirePermission('ehr:follow_ups:update')
  async updateFollowUpNote(
    @CurrentClinicId() clinicId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateFollowUpNoteDto,
  ) {
    return this.medicalVisitsService.updateFollowUpNote(clinicId, noteId, dto);
  }

  /**
   * DELETE /medical-visits/follow-up-notes/:noteId
   * Eliminar nota de seguimiento
   */
  @Delete('follow-up-notes/:noteId')
  @HttpCode(204)
  @RequirePermission('ehr:follow_ups:update')
  async deleteFollowUpNote(
    @CurrentClinicId() clinicId: string,
    @Param('noteId') noteId: string,
  ) {
    await this.medicalVisitsService.deleteFollowUpNote(clinicId, noteId);
  }

  // ====================================================================
  // MEDICAL HISTORY
  // ====================================================================

  /**
   * GET /medical-visits/pet/:petId/history
   * Obtener historial médico completo
   */
  @Get('pet/:petId/history')
  @RequirePermission('ehr:medical_history:read')
  async getPetMedicalHistory(
    @CurrentClinicId() clinicId: string,
    @Param('petId') petId: string,
  ) {
    return this.medicalVisitsService.getMedicalHistory(clinicId, petId);
  }
}