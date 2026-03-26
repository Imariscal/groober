import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  MedicalVisit,
  Prescription,
  Vaccination,
  MedicationAllergy,
  DiagnosticOrder,
  Appointment,
  Pet,
  User,
  MedicalVisitExam,
  MedicalVisitDiagnosis,
  DiagnosticTestResult,
  MedicalProcedure,
  FollowUpNote,
  MedicalAttachment,
  Vaccine,
} from '@/database/entities';
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
} from '../dtos';
import { TimezoneService } from '@/shared/timezone/timezone.service';
import { MedicalVisitsRepository } from '../repositories/medical-visits.repository';

@Injectable()
export class MedicalVisitsService {
  constructor(
    private readonly medicalVisitsRepo: MedicalVisitsRepository,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Vaccination)
    private readonly vaccinationRepo: Repository<Vaccination>,
    @InjectRepository(MedicationAllergy)
    private readonly allergyRepo: Repository<MedicationAllergy>,
    @InjectRepository(DiagnosticOrder)
    private readonly diagnosticOrderRepo: Repository<DiagnosticOrder>,
    @InjectRepository(MedicalVisitExam)
    private readonly examRepo: Repository<MedicalVisitExam>,
    @InjectRepository(MedicalVisitDiagnosis)
    private readonly diagnosisRepo: Repository<MedicalVisitDiagnosis>,
    @InjectRepository(DiagnosticTestResult)
    private readonly testResultRepo: Repository<DiagnosticTestResult>,
    @InjectRepository(MedicalProcedure)
    private readonly procedureRepo: Repository<MedicalProcedure>,
    @InjectRepository(FollowUpNote)
    private readonly followUpNoteRepo: Repository<FollowUpNote>,
    @InjectRepository(MedicalAttachment)
    private readonly attachmentRepo: Repository<MedicalAttachment>,
    @InjectRepository(Vaccine)
    private readonly vaccineRepo: Repository<Vaccine>,
    private readonly timezoneService: TimezoneService,
  ) {}

  // ============================================================================
  // MEDICAL VISITS - CRUD
  // ============================================================================

  /**
   * Crear una visita médica nueva
   */
  async create(
    clinicId: string,
    dto: CreateMedicalVisitDto,
    userId: string,
  ): Promise<MedicalVisit> {
    // Validar appointment existe y pertenece a clinic
    const appointment = await this.appointmentRepo.findOne({
      where: {
        id: dto.appointmentId,
        clinicId,
      },
      relations: ['pet'],
    });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment no encontrado en esta clínica',
      );
    }

    // Validar pet existe
    const pet = await this.petRepo.findOne({
      where: {
        id: dto.petId,
        clinicId,
      },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    // Validar veterinario si se proporciona
    let veterinarian: User | null = null;
    if (dto.veterinarianId) {
      veterinarian = await this.userRepo.findOne({
        where: {
          id: dto.veterinarianId,
          clinicId,
        },
      });

      if (!veterinarian) {
        throw new NotFoundException('Veterinario no encontrado');
      }
    }

    // Crear visita médica
    const medicalVisit = new MedicalVisit();
    medicalVisit.clinicId = clinicId;
    medicalVisit.appointmentId = appointment.id;
    medicalVisit.petId = pet.id;
    medicalVisit.veterinarianId = veterinarian?.id;
    medicalVisit.visitDate = appointment.scheduledAt;
    medicalVisit.visitType = dto.visitType;
    medicalVisit.reasonForVisit = dto.reasonForVisit;
    medicalVisit.chiefComplaint = dto.chiefComplaint;
    medicalVisit.weight = dto.weight;
    medicalVisit.temperature = dto.temperature;
    medicalVisit.heartRate = dto.heartRate;
    medicalVisit.respiratoryRate = dto.respiratoryRate;
    medicalVisit.bloodPressure = dto.bloodPressure;
    medicalVisit.bodyConditionScore = dto.bodyConditionScore;
    medicalVisit.coatCondition = dto.coatCondition;
    medicalVisit.generalNotes = dto.generalNotes;
    medicalVisit.preliminaryDiagnosis = dto.preliminaryDiagnosis;
    medicalVisit.treatmentPlan = dto.treatmentPlan;
    medicalVisit.followUpRequired = dto.followUpRequired || false;
    medicalVisit.followUpDate = dto.followUpDate
      ? new Date(dto.followUpDate)
      : undefined;
    medicalVisit.status = 'DRAFT';
    medicalVisit.createdBy = userId;
    medicalVisit.modifiedBy = userId;

    return this.medicalVisitsRepo.save(medicalVisit);
  }

  /**
   * Obtener una visita médica
   */
  async findOne(
    clinicId: string,
    medicalVisitId: string,
  ): Promise<MedicalVisit> {
    const visit = await this.medicalVisitsRepo.findOneByClinic(
      clinicId,
      medicalVisitId,
    );

    if (!visit) {
      throw new NotFoundException('Visita médica no encontrada');
    }

    return visit;
  }

  /**
   * Obtener todas las visitas de una mascota
   */
  async findByPet(
    clinicId: string,
    petId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.medicalVisitsRepo.findByClinicAndPet(
      clinicId,
      petId,
      limit,
      offset,
    );
  }

  /**
   * Actualizar visita médica (solo si está en DRAFT)
   */
  async update(
    clinicId: string,
    medicalVisitId: string,
    dto: Partial<CreateMedicalVisitDto>,
    userId: string,
  ): Promise<MedicalVisit> {
    const visit = await this.findOne(clinicId, medicalVisitId);

    if (visit.status !== 'DRAFT') {
      throw new ConflictException(
        'No se pueden editar visitas médicas confirmadas',
      );
    }

    // Actualizar campos
    if (dto.reasonForVisit !== undefined)
      visit.reasonForVisit = dto.reasonForVisit;
    if (dto.chiefComplaint !== undefined)
      visit.chiefComplaint = dto.chiefComplaint;
    if (dto.weight !== undefined) visit.weight = dto.weight;
    if (dto.temperature !== undefined) visit.temperature = dto.temperature;
    if (dto.heartRate !== undefined) visit.heartRate = dto.heartRate;
    if (dto.respiratoryRate !== undefined)
      visit.respiratoryRate = dto.respiratoryRate;
    if (dto.bloodPressure !== undefined)
      visit.bloodPressure = dto.bloodPressure;
    if (dto.bodyConditionScore !== undefined)
      visit.bodyConditionScore = dto.bodyConditionScore;
    if (dto.coatCondition !== undefined)
      visit.coatCondition = dto.coatCondition;
    if (dto.generalNotes !== undefined) visit.generalNotes = dto.generalNotes;
    if (dto.preliminaryDiagnosis !== undefined)
      visit.preliminaryDiagnosis = dto.preliminaryDiagnosis;
    if (dto.treatmentPlan !== undefined)
      visit.treatmentPlan = dto.treatmentPlan;
    if (dto.followUpRequired !== undefined)
      visit.followUpRequired = dto.followUpRequired;

    visit.modifiedBy = userId;

    return this.medicalVisitsRepo.save(visit);
  }

  /**
   * Cambiar estado de visita médica
   */
  async updateStatus(
    clinicId: string,
    medicalVisitId: string,
    newStatus: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED',
    userId: string,
    signedByVeterinarianId?: string,
  ): Promise<MedicalVisit> {
    const visit = await this.findOne(clinicId, medicalVisitId);

    // Validar transiciones de estado
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['IN_PROGRESS', 'COMPLETED'],
      IN_PROGRESS: ['COMPLETED', 'DRAFT'],
      COMPLETED: ['SIGNED', 'DRAFT'],
      SIGNED: [],
    };

    if (!validTransitions[visit.status]?.includes(newStatus)) {
      throw new ConflictException(
        `No se puede cambiar de ${visit.status} a ${newStatus}`,
      );
    }

    visit.status = newStatus;
    visit.modifiedBy = userId;

    // Si se proporciona un veterinario para firmar cuando se marca como COMPLETED
    // se establece el signed_by_veterinarian_id
    if (newStatus === 'COMPLETED' && signedByVeterinarianId) {
      visit.signedByVeterinarianId = signedByVeterinarianId;
      visit.signedAt = new Date();
      visit.status = 'SIGNED'; // Cambiar directamente a SIGNED
    }

    return this.medicalVisitsRepo.save(visit);
  }

  /**
   * Firmar registro médico (solo veterinarios)
   */
  async signMedicalRecord(
    clinicId: string,
    medicalVisitId: string,
    dto: SignMedicalRecordDto,
    userId: string,
  ): Promise<MedicalVisit> {
    const visit = await this.findOne(clinicId, medicalVisitId);

    if (visit.status !== 'COMPLETED') {
      throw new ConflictException(
        'La visita debe estar COMPLETED antes de firmar',
      );
    }

    // TODO: v2 - Guardar signatureImage en storage (S3)
    // Por ahora solo marcamos como signed

    visit.status = 'SIGNED';
    visit.signedAt = new Date(dto.timestamp);
    visit.signedByVeterinarianId = userId;
    visit.modifiedBy = userId;

    return this.medicalVisitsRepo.save(visit);
  }

  // ============================================================================
  // DIAGNOSES
  // ============================================================================

  /**
   * Agregar diagnóstico a una visita
   */
  async addDiagnosis(
    clinicId: string,
    medicalVisitId: string,
    dto: AddDiagnosisDto,
  ): Promise<MedicalVisitDiagnosis> {
    const visit = await this.findOne(clinicId, medicalVisitId);

    const diagnosis = new MedicalVisitDiagnosis();
    diagnosis.medicalVisitId = visit.id;
    diagnosis.diagnosisCode = dto.diagnosisCode;
    diagnosis.diagnosisName = dto.diagnosisName;
    diagnosis.severity = dto.severity;
    diagnosis.notes = dto.notes;

    return this.diagnosisRepo.save(diagnosis);
  }

  /**
   * Obtener diagnósticos de una visita
   */
  async getDiagnosesByVisit(
    clinicId: string,
    medicalVisitId: string,
  ): Promise<MedicalVisitDiagnosis[]> {
    await this.findOne(clinicId, medicalVisitId);

    return this.diagnosisRepo.find({
      where: {
        medicalVisitId,
      },
    });
  }

  // ============================================================================
  // PRESCRIPTIONS
  // ============================================================================

  /**
   * Crear receta
   */
  async createPrescription(
    clinicId: string,
    medicalVisitId: string,
    dto: CreatePrescriptionDto,
    userId: string,
  ): Promise<Prescription> {
    const visit = await this.findOne(clinicId, medicalVisitId);

    // Validar que no haya alergias
    const allergies = await this.allergyRepo.find({
      where: {
        clinicId,
        petId: visit.petId,
        medicationName: dto.medicationName,
      },
    });

    if (allergies.length > 0) {
      throw new ConflictException(
        `⚠️ La mascota tiene alergia conocida a ${dto.medicationName} (${allergies[0].severity})`,
      );
    }

    // Validar que startDate sea hoy o futuro (usando timezone de la clínica)
    const clinicTz = await this.timezoneService.getClinicTimezone(clinicId);
    
    // Obtener "hoy" en el timezone de la clínica
    const nowUtc = new Date();
    const todayInClinicTz = this.timezoneService.toClinicDateKey(clinicTz, nowUtc);
    
    // Comparar strings de fecha (YYYY-MM-DD)
    if (dto.startDate < todayInClinicTz) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser en el pasado',
      );
    }

    // Validar que endDate > startDate
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException(
        'La fecha final debe ser después de la fecha inicial',
      );
    }

    // Convertir strings de fecha (YYYY-MM-DD) a UTC dates
    // preservando el significado en el timezone de la clínica
    const startDate = new Date(
      this.timezoneService.parseInClinicTzToUtc(
        clinicTz,
        dto.startDate + ' 00:00:00'
      )
    );
    const endDate = new Date(
      this.timezoneService.parseInClinicTzToUtc(
        clinicTz,
        dto.endDate + ' 23:59:59'
      )
    );

    const prescription = new Prescription();
    prescription.clinicId = clinicId;
    prescription.medicalVisitId = visit.id;
    prescription.petId = visit.petId;
    prescription.prescribedByVeterinarianId = userId;
    prescription.medicationId = dto.medicationId;
    prescription.medicationName = dto.medicationName;
    prescription.dosage = dto.dosage;
    prescription.dosageUnit = dto.dosageUnit;
    prescription.frequency = dto.frequency;
    prescription.durationDays = dto.durationDays;
    prescription.quantity = dto.quantity;
    prescription.route = dto.route;
    prescription.instructions = dto.instructions;
    prescription.refillsAllowed = dto.refillsAllowed || 0;
    prescription.prescribedDate = new Date();
    prescription.startDate = startDate;
    prescription.endDate = endDate;
    prescription.status = 'ACTIVE';

    return this.prescriptionRepo.save(prescription);
  }

  /**
   * Obtener recetas activas de una mascota
   */
  async getActivePrescriptions(
    clinicId: string,
    petId: string,
  ): Promise<Prescription[]> {
    return this.prescriptionRepo.find({
      where: {
        clinicId,
        petId,
        status: 'ACTIVE',
      },
      order: {
        prescribedDate: 'DESC',
      },
    });
  }

  /**
   * Obtener medicamentos únicos prescritos en la clínica (para autocomplete)
   */
  async getUniqueMedications(clinicId: string): Promise<string[]> {
    const results = await this.prescriptionRepo
      .createQueryBuilder('prescription')
      .select('DISTINCT prescription.medicationName', 'medicationName')
      .where('prescription.clinicId = :clinicId', { clinicId })
      .orderBy('prescription.medicationName', 'ASC')
      .getRawMany();

    return results.map((r: any) => r.medicationName).filter(Boolean);
  }

  /**
   * Obtener medicamentos más usados recientemente (últimos 30 días)
   * Devuelve array de medicamentos ordenados por frecuencia de uso
   */
  async getMostUsedMedications(
    clinicId: string,
    limit: number = 10,
  ): Promise<{ medicationName: string; usageCount: number }[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = await this.prescriptionRepo
      .createQueryBuilder('prescription')
      .select('prescription.medicationName', 'medicationName')
      .addSelect('COUNT(*)', 'count')
      .where('prescription.clinicId = :clinicId', { clinicId })
      .andWhere('prescription.createdAt >= :createdAt', {
        createdAt: thirtyDaysAgo,
      })
      .groupBy('prescription.medicationName')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r: any) => ({
      medicationName: r.medicationName,
      usageCount: parseInt(r.count, 10),
    }));
  }

  /**
   * Actualizar receta
   */
  async updatePrescription(
    clinicId: string,
    prescriptionId: string,
    dto: Partial<CreatePrescriptionDto>,
  ): Promise<Prescription> {
    const prescription = await this.prescriptionRepo.findOne({
      where: {
        id: prescriptionId,
        clinicId,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Receta no encontrada');
    }

    if (dto.medicationName !== undefined) prescription.medicationName = dto.medicationName;
    if (dto.dosage !== undefined) prescription.dosage = dto.dosage;
    if (dto.dosageUnit !== undefined) prescription.dosageUnit = dto.dosageUnit;
    if (dto.frequency !== undefined) prescription.frequency = dto.frequency;
    if (dto.durationDays !== undefined) prescription.durationDays = dto.durationDays;
    if (dto.quantity !== undefined) prescription.quantity = dto.quantity;
    if (dto.route !== undefined) prescription.route = dto.route;
    if (dto.instructions !== undefined) prescription.instructions = dto.instructions;
    if (dto.refillsAllowed !== undefined) prescription.refillsAllowed = dto.refillsAllowed;

    return this.prescriptionRepo.save(prescription);
  }

  /**
   * Eliminar receta
   */
  async deletePrescription(
    clinicId: string,
    prescriptionId: string,
  ): Promise<void> {
    const prescription = await this.prescriptionRepo.findOne({
      where: {
        id: prescriptionId,
        clinicId,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Receta no encontrada');
    }

    await this.prescriptionRepo.remove(prescription);
  }

  // ============================================================================
  // VACCINATIONS
  // ============================================================================

  /**
   * Registrar vacunación
   */
  async recordVaccination(
    clinicId: string,
    dto: CreateVaccinationDto,
    userId: string,
  ): Promise<Vaccination> {
    // Validar pet
    const pet = await this.petRepo.findOne({
      where: {
        id: dto.petId,
        clinicId,
      },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    // Validar vaccine (catalog entry)
    const vaccine = await this.vaccineRepo.findOne({
      where: {
        id: dto.vaccineId,
        clinicId,
        isActive: true,
      },
    });

    if (!vaccine) {
      throw new NotFoundException('Vacuna no encontrada o no activa');
    }

    // Calcular nextDueDate automáticamente
    const administeredDate = new Date(dto.administeredDate);
    let nextDueDate: Date | undefined = undefined;
    
    // Solo calcular nextDueDate si la vacuna tiene boosterDays (no es dosis única)
    if (vaccine.boosterDays !== null && vaccine.boosterDays !== undefined) {
      nextDueDate = new Date(administeredDate);
      nextDueDate.setDate(nextDueDate.getDate() + vaccine.boosterDays);
    }

    const vaccination = new Vaccination();
    vaccination.clinicId = clinicId;
    vaccination.petId = pet.id;
    vaccination.vaccineId = vaccine.id;
    vaccination.vaccineName = vaccine.name;
    vaccination.vaccineBatch = dto.vaccineBatch;
    vaccination.manufacturer = dto.manufacturer;
    vaccination.lotNumber = dto.lotNumber;
    vaccination.administeredDate = administeredDate;
    vaccination.expirationDate = dto.expirationDate
      ? new Date(dto.expirationDate)
      : undefined;
    vaccination.adverseReactions = dto.adverseReactions;
    vaccination.status = 'ADMINISTERED';
    vaccination.veterinarianId = userId;
    vaccination.nextDueDate = nextDueDate;
    vaccination.notes = dto.notes;

    return this.vaccinationRepo.save(vaccination);
  }

  /**
   * Obtener cronograma de vacunaciones
   */
  async getVaccinationSchedule(
    clinicId: string,
    petId: string,
  ): Promise<Vaccination[]> {
    return this.vaccinationRepo.find({
      where: {
        clinicId,
        petId,
      },
      order: {
        administeredDate: 'DESC',
      },
    });
  }

  /**
   * Obtener vacunas vencidas/próximas a vencer
   */
  async getOverdueVaccinations(
    clinicId: string,
    petId: string,
  ): Promise<Vaccination[]> {
    const today = new Date();

    return this.vaccinationRepo.find({
      where: {
        clinicId,
        petId,
        nextDueDate: LessThanOrEqual(today),
      },
    });
  }

  /**
   * Actualizar vacunación
   */
  async updateVaccination(
    clinicId: string,
    vaccinationId: string,
    dto: Partial<CreateVaccinationDto>,
  ): Promise<Vaccination> {
    const vaccination = await this.vaccinationRepo.findOne({
      where: {
        id: vaccinationId,
        clinicId,
      },
      relations: ['vaccine'],
    });

    if (!vaccination) {
      throw new NotFoundException('Vacunación no encontrada');
    }

    // Si cambia la vacuna, validar y recalcular nextDueDate
    if (dto.vaccineId && dto.vaccineId !== vaccination.vaccineId) {
      const vaccine = await this.vaccineRepo.findOne({
        where: {
          id: dto.vaccineId,
          clinicId,
          isActive: true,
        },
      });

      if (!vaccine) {
        throw new NotFoundException('Vacuna no encontrada o no activa');
      }

      vaccination.vaccineId = vaccine.id;
      vaccination.vaccineName = vaccine.name;
    }

    // Si cambia la fecha de administración, recalcular nextDueDate
    if (dto.administeredDate !== undefined) {
      vaccination.administeredDate = new Date(dto.administeredDate);
    }

    // Recalcular nextDueDate si cambiaron administeredDate o vaccineId
    if (vaccination.vaccine || dto.vaccineId || dto.administeredDate) {
      const vaccine = vaccination.vaccine ||
        (await this.vaccineRepo.findOne({
          where: { id: vaccination.vaccineId },
        }));

      if (vaccine && vaccine.boosterDays !== null && vaccine.boosterDays !== undefined) {
        const nextDueDate = new Date(vaccination.administeredDate);
        nextDueDate.setDate(nextDueDate.getDate() + vaccine.boosterDays);
        vaccination.nextDueDate = nextDueDate;
      } else {
        // Para vacunas de dosis única, no hay nextDueDate
        vaccination.nextDueDate = undefined;
      }
    }

    // Actualizar campos opcionales
    if (dto.vaccineBatch !== undefined) vaccination.vaccineBatch = dto.vaccineBatch;
    if (dto.manufacturer !== undefined) vaccination.manufacturer = dto.manufacturer;
    if (dto.lotNumber !== undefined) vaccination.lotNumber = dto.lotNumber;
    if (dto.expirationDate !== undefined) {
      vaccination.expirationDate = dto.expirationDate
        ? new Date(dto.expirationDate)
        : undefined;
    }
    if (dto.adverseReactions !== undefined) vaccination.adverseReactions = dto.adverseReactions;
    if (dto.notes !== undefined) vaccination.notes = dto.notes;

    return this.vaccinationRepo.save(vaccination);
  }

  /**
   * Eliminar vacunación
   */
  async deleteVaccination(
    clinicId: string,
    vaccinationId: string,
  ): Promise<void> {
    const vaccination = await this.vaccinationRepo.findOne({
      where: {
        id: vaccinationId,
        clinicId,
      },
    });

    if (!vaccination) {
      throw new NotFoundException('Vacunación no encontrada');
    }

    await this.vaccinationRepo.remove(vaccination);
  }

  // ============================================================================
  // MEDICATION ALLERGIES
  // ============================================================================

  /**
   * Registrar alergia a medicamento
   */
  async recordMedicationAllergy(
    clinicId: string,
    dto: CreateMedicationAllergyDto,
    userId: string,
  ): Promise<MedicationAllergy> {
    const pet = await this.petRepo.findOne({
      where: {
        id: dto.petId,
        clinicId,
      },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    const allergy = new MedicationAllergy();
    allergy.clinicId = clinicId;
    allergy.petId = pet.id;
    allergy.medicationId = dto.medicationId;
    allergy.medicationName = dto.medicationName;
    allergy.severity = dto.severity;
    allergy.reaction = dto.reaction;
    allergy.documentedDate = new Date();
    allergy.documentedBy = userId;
    allergy.notes = dto.notes;

    return this.allergyRepo.save(allergy);
  }

  /**
   * Obtener alergias de una mascota
   */
  async getAllergies(
    clinicId: string,
    petId: string,
  ): Promise<MedicationAllergy[]> {
    return this.allergyRepo.find({
      where: {
        clinicId,
        petId,
      },
    });
  }

  /**
   * Actualizar alergia a medicamento
   */
  async updateAllergy(
    clinicId: string,
    allergyId: string,
    dto: Partial<CreateMedicationAllergyDto>,
  ): Promise<MedicationAllergy> {
    const allergy = await this.allergyRepo.findOne({
      where: {
        id: allergyId,
        clinicId,
      },
    });

    if (!allergy) {
      throw new NotFoundException('Alergia no encontrada');
    }

    if (dto.medicationName !== undefined) allergy.medicationName = dto.medicationName;
    if (dto.severity !== undefined) allergy.severity = dto.severity;
    if (dto.reaction !== undefined) allergy.reaction = dto.reaction;
    if (dto.notes !== undefined) allergy.notes = dto.notes;

    return this.allergyRepo.save(allergy);
  }

  /**
   * Eliminar alergia a medicamento
   */
  async deleteAllergy(
    clinicId: string,
    allergyId: string,
  ): Promise<void> {
    const allergy = await this.allergyRepo.findOne({
      where: {
        id: allergyId,
        clinicId,
      },
    });

    if (!allergy) {
      throw new NotFoundException('Alergia no encontrada');
    }

    await this.allergyRepo.remove(allergy);
  }

  // ============================================================================
  // DIAGNOSTIC ORDERS
  // ============================================================================

  /**
   * Crear orden de diagnóstico
   */
  async createDiagnosticOrder(
    clinicId: string,
    medicalVisitId: string,
    dto: CreateDiagnosticOrderDto,
    userId: string,
  ): Promise<DiagnosticOrder> {
    const order = new DiagnosticOrder();
    order.clinicId = clinicId;
    order.medicalVisitId = medicalVisitId;
    order.petId = dto.petId;
    order.orderedByVeterinarianId = userId;
    order.testType = dto.testType;
    order.testName = dto.testName;
    order.reason = dto.reason;
    order.orderDate = new Date();
    order.dueDate = new Date(dto.dueDate);
    order.labName = dto.labName;
    order.labReferenceId = dto.labReferenceId;
    order.status = 'ORDERED';

    return this.diagnosticOrderRepo.save(order);
  }

  /**
   * Obtener órdenes de diagnóstico de una visita
   */
  async getDiagnosticOrders(
    clinicId: string,
    medicalVisitId: string,
  ): Promise<DiagnosticOrder[]> {
    return this.diagnosticOrderRepo.find({
      where: {
        clinicId,
        medicalVisitId,
      },
      relations: ['testResults'],
    });
  }

  /**
   * Marcar muestra como recolectada
   */
  async markSampleCollected(
    clinicId: string,
    orderId: string,
  ): Promise<DiagnosticOrder> {
    const order = await this.diagnosticOrderRepo.findOne({
      where: {
        id: orderId,
        clinicId,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden de diagnóstico no encontrada');
    }

    order.status = 'SAMPLE_COLLECTED';
    order.specimenCollectedDate = new Date();

    return this.diagnosticOrderRepo.save(order);
  }

  /**
   * Marcar orden como completada
   */
  async completeOrder(
    clinicId: string,
    orderId: string,
  ): Promise<DiagnosticOrder> {
    const order = await this.diagnosticOrderRepo.findOne({
      where: {
        id: orderId,
        clinicId,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden de diagnóstico no encontrada');
    }

    order.status = 'COMPLETED';

    return this.diagnosticOrderRepo.save(order);
  }

  /**
   * Actualizar orden de diagnóstico
   */
  async updateDiagnosticOrder(
    clinicId: string,
    orderId: string,
    dto: Partial<CreateDiagnosticOrderDto>,
  ): Promise<DiagnosticOrder> {
    const order = await this.diagnosticOrderRepo.findOne({
      where: {
        id: orderId,
        clinicId,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden de diagnóstico no encontrada');
    }

    if (dto.testType !== undefined) order.testType = dto.testType;
    if (dto.testName !== undefined) order.testName = dto.testName;
    if (dto.reason !== undefined) order.reason = dto.reason;
    if (dto.labName !== undefined) order.labName = dto.labName;
    if (dto.dueDate !== undefined) order.dueDate = new Date(dto.dueDate);

    return this.diagnosticOrderRepo.save(order);
  }

  /**
   * Eliminar orden de diagnóstico
   */
  async deleteDiagnosticOrder(
    clinicId: string,
    orderId: string,
  ): Promise<void> {
    const order = await this.diagnosticOrderRepo.findOne({
      where: {
        id: orderId,
        clinicId,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden de diagnóstico no encontrada');
    }

    await this.diagnosticOrderRepo.remove(order);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Obtener historial médico completo de una mascota
   */
  async getMedicalHistory(clinicId: string, petId: string) {
    // Obtener mascota
    const pet = await this.petRepo.findOne({
      where: { id: petId, clinicId },
    });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${petId} not found`);
    }

    // Obtener visitas médicas
    const [medicalVisits, totalVisits] = await this.medicalVisitsRepo.findByClinicAndPet(
      clinicId,
      petId,
      999,
      0,
    );

    // Obtener vacunaciones
    const vaccinations = await this.vaccinationRepo.find({
      where: {
        clinicId,
        petId,
      },
      order: {
        administeredDate: 'DESC',
      },
    });

    // Obtener alergias
    const allergies = await this.allergyRepo.find({
      where: {
        clinicId,
        petId,
      },
    });

    // Obtener prescripciones
    const prescriptions = await this.prescriptionRepo.find({
      where: {
        clinicId,
        petId,
      },
      order: {
        prescribedDate: 'DESC',
      },
    });

    // Obtener órdenes diagnósticas
    const diagnosticOrders = await this.diagnosticOrderRepo.find({
      where: {
        clinicId,
        petId,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Obtener procedimientos
    const procedures = await this.procedureRepo.find({
      where: {
        clinicId,
        petId,
      },
      order: {
        procedureDate: 'DESC',
      },
    });

    // Vacunaciones vencidas (si la próxima dosis debe ser hace más de 30 días)
    const overdueVaccinations = vaccinations.filter(v => {
      if (!v.nextDueDate) return false;
      return new Date(v.nextDueDate) < new Date();
    });

    // Prescripciones activas (no completadas)
    const activePrescriptions = prescriptions.filter(p => p.status !== 'COMPLETED');

    // Alergias conocidas (nombres de medicamentos)
    const knownAllergies = allergies.map(a => a.medicationName);

    // Fecha de la última visita
    const lastVisitDate = medicalVisits.length > 0 ? medicalVisits[0].visitDate : undefined;

    return {
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        dateOfBirth: pet.dateOfBirth,
      },
      medicalVisits,
      prescriptions,
      vaccinations,
      allergies,
      diagnosticOrders,
      procedures: procedures || [],
      totalVisits,
      lastVisitDate,
      overdueVaccinations,
      activePrescriptions,
      knownAllergies,
    };
  }

  /**
   * Crear procedimiento
   */
  async createProcedure(
    clinicId: string,
    medicalVisitId: string,
    dto: CreateMedicalProcedureDto,
    userId: string,
  ): Promise<MedicalProcedure> {
    const visit = await this.findOne(clinicId, medicalVisitId);

    const procedure = new MedicalProcedure();
    procedure.clinicId = clinicId;
    procedure.medicalVisitId = visit.id;
    procedure.petId = visit.petId;
    procedure.procedureType = dto.procedureType;
    procedure.procedureName = dto.procedureName;
    procedure.procedureDate = new Date(dto.procedureDate);
    if (dto.durationMinutes !== undefined) procedure.durationMinutes = dto.durationMinutes;
    if (dto.anesthesiaType !== undefined) procedure.anesthesiaType = dto.anesthesiaType;
    if (dto.complications !== undefined) procedure.complications = dto.complications;
    if (dto.notes !== undefined) procedure.notes = dto.notes;
    procedure.performedByVeterinarianId = userId;

    return this.procedureRepo.save(procedure);
  }

  /**
   * Actualizar procedimiento
   */
  async updateProcedure(
    clinicId: string,
    procedureId: string,
    dto: Partial<CreateMedicalProcedureDto>,
  ): Promise<MedicalProcedure> {
    const procedure = await this.procedureRepo.findOne({
      where: {
        id: procedureId,
        clinicId,
      },
    });

    if (!procedure) {
      throw new NotFoundException('Procedimiento no encontrado');
    }

    if (dto.procedureType !== undefined) procedure.procedureType = dto.procedureType;
    if (dto.procedureName !== undefined) procedure.procedureName = dto.procedureName;
    if (dto.procedureDate !== undefined) procedure.procedureDate = new Date(dto.procedureDate);
    if (dto.durationMinutes !== undefined) procedure.durationMinutes = dto.durationMinutes;
    if (dto.anesthesiaType !== undefined) procedure.anesthesiaType = dto.anesthesiaType;
    if (dto.complications !== undefined) procedure.complications = dto.complications;
    if (dto.notes !== undefined) procedure.notes = dto.notes;

    return this.procedureRepo.save(procedure);
  }

  /**
   * Eliminar procedimiento
   */
  async deleteProcedure(
    clinicId: string,
    procedureId: string,
  ): Promise<void> {
    const procedure = await this.procedureRepo.findOne({
      where: {
        id: procedureId,
        clinicId,
      },
    });

    if (!procedure) {
      throw new NotFoundException('Procedimiento no encontrado');
    }

    await this.procedureRepo.remove(procedure);
  }

  // ============================================================================
  // FOLLOW-UP NOTES
  // ============================================================================

  /**
   * Crear nota de seguimiento
   */
  async createFollowUpNote(
    clinicId: string,
    medicalVisitId: string,
    dto: CreateFollowUpNoteDto,
    userId: string,
  ): Promise<FollowUpNote> {
    const visit = await this.findOne(clinicId, medicalVisitId);

    const note = new FollowUpNote();
    note.clinicId = clinicId;
    note.medicalVisitId = visit.id;
    note.petId = visit.petId;
    note.noteContent = dto.noteContent;
    if (dto.statusUpdate !== undefined) note.statusUpdate = dto.statusUpdate;
    note.noteDate = dto.noteDate ? new Date(dto.noteDate) : new Date();
    note.writtenBy = userId;

    return this.followUpNoteRepo.save(note);
  }

  /**
   * Actualizar nota de seguimiento
   */
  async updateFollowUpNote(
    clinicId: string,
    noteId: string,
    dto: Partial<CreateFollowUpNoteDto>,
  ): Promise<FollowUpNote> {
    const note = await this.followUpNoteRepo.findOne({
      where: {
        id: noteId,
        clinicId,
      },
    });

    if (!note) {
      throw new NotFoundException('Nota de seguimiento no encontrada');
    }

    if (dto.noteContent !== undefined) note.noteContent = dto.noteContent;
    if (dto.statusUpdate !== undefined) note.statusUpdate = dto.statusUpdate;
    if (dto.noteDate !== undefined) note.noteDate = new Date(dto.noteDate);

    return this.followUpNoteRepo.save(note);
  }

  /**
   * Eliminar nota de seguimiento
   */
  async deleteFollowUpNote(
    clinicId: string,
    noteId: string,
  ): Promise<void> {
    const note = await this.followUpNoteRepo.findOne({
      where: {
        id: noteId,
        clinicId,
      },
    });

    if (!note) {
      throw new NotFoundException('Nota de seguimiento no encontrada');
    }

    await this.followUpNoteRepo.remove(note);
  }
}
