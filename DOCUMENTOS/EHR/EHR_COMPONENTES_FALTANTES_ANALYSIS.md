# 🏥 Análisis EHR: Componentes Faltantes + Refactorización a EntityManagementPage

**Fecha:** Marzo 12, 2026  
**Análisis:** Comparación EHR_FRONTEND_IMPLEMENTATION.md vs Arquitectura EntityManagementPage  
**Conclusión:** Refactorizar para usar EntityManagementPage (patrón profesional)

---

## 🔍 Problema Identificado

El documento `EHR_FRONTEND_IMPLEMENTATION.md` especifica componentes siguiendo `HOMOLOGACION_VISTAS_STANDAR.md` (arquitectura manual), pero **NO aprovecha `EntityManagementPage`** que es la arquitectura profesional usada en Clientes.

**Comparación:**
```
❌ EHR Actual (Especificado)    ✅ Clientes (Referencia)
├─ Manual page.tsx              └─ EntityManagementPage
├─ Modales individuales         └─ Modales + Config
├─ Sin KPIs dinámicos           └─ KPIs calculados
├─ Sin búsqueda/filtros avanzado └─ Búsqueda, filtros, sort
└─ Código repetido              └─ Reutilizable
```

---

## 📋 Componentes DOCUMENTADOS vs REALES

### ✅ Documentados en EHR_FRONTEND_IMPLEMENTATION.md
```
1. ✅ Types (src/types/ehr.ts)
2. ✅ API Layer (src/api/ehr-api.ts)
3. ✅ Store (src/store/ehr-store.ts)
4. ✅ CreateMedicalVisitModal.tsx
5. ✅ EditMedicalVisitModal.tsx
6. ✅ DeleteMedicalVisitConfirmation.tsx
7. ✅ MedicalVisitCard.tsx
8. ✅ MedicalVisitsTable.tsx
9. ✅ Page (/clinic/medical-records)
```

### ❌ INEXISTENTES en el código actual
```
Todos los anteriores ❌
```

---

## 🎯 Análisis Arquitectónico: Manual vs EntityManagementPage

### ARQUITECTURA ACTUAL (EHR_FRONTEND_IMPLEMENTATION.md)

```tsx
// ❌ MANUAL - Sin reutilización
src/app/(protected)/clinic/medical-records/page.tsx
├─ State: medicalVisits[], searchTerm, viewMode, filters
├─ Modals: 3 separados
├─ Handlers: Búsqueda, filtrado, ordenamiento MANUAL
└─ Render:
    ├─ Header
    ├─ Sidebar (filtros)
    ├─ Stats (contadores manuales)
    ├─ EntityList
    │   ├─ MedicalVisitCard
    │   └─ MedicalVisitsTable
    └─ Modals
```

**Problemas:**
- 🔴 Código duplicado (se repite en clientes, pets, etc)
- 🔴 Estado complejo en page.tsx
- 🔴 Sin KPIs dinámicos
- 🔴 Sin búsqueda/filtros reutilizables
- 🔴 No escalable a otras entidades

---

### ARQUITECTURA RECOMENDADA (EntityManagementPage)

```tsx
// ✅ PROFESIONAL - Reutilizable
src/app/(protected)/clinic/medical-records/page.tsx
├─ State: medicalVisits[], selectedVisit, modals
├─ Handlers: CRUD básico
└─ Render:
    └─ EntityManagementPage
        ├─ EntityPageLayout
        │   └─ PageHeader (breadcrumbs, title, CTA)
        ├─ KpiCards (de config)
        ├─ EntityToolbar (búsqueda, filtros, sort)
        ├─ EntityList (toggle cards/table)
        │   ├─ MedicalVisitCard (presenta item)
        │   └─ MedicalVisitsTable (presenta lista)
        └─ Modals (3)

src/config/medicalVisitsConfig.ts ← DECLARATIVO
├─ entityName, pageHeader
├─ kpis: (data) => []
├─ cardAdapter: (visit) => EntityCardModel
└─ tableColumns: ColumnDef<MedicalVisit>[]
```

**Ventajas:**
- ✅ Una sola arquitectura para todos los módulos
- ✅ Estado centralizado y simple
- ✅ KPIs dinámicos
- ✅ Búsqueda + filtros + ordenamiento auto
- ✅ 40% menos código
- ✅ Escalable

---

## 📊 Comparativa: Componentes Necesarios

### Opción A: MANUAL (Como está documentado)

| Componente | Ubicación | Responsabilidad |
|-----------|-----------|-----------------|
| page.tsx | `/clinic/medical-records/` | Toda la lógica |
| CreateMedicalVisitModal | `/components/` | Create form |
| EditMedicalVisitModal | `/components/` | Edit form |
| DeleteMedicalVisitConfirmation | `/components/` | Delete confirm |
| MedicalVisitCard | `/components/platform/` | Card view |
| MedicalVisitsTable | `/components/platform/` | Table view |
| **Total Líneas** | | ~800 LOC |
| **Reutilización** | | ❌ 0% |

---

### Opción B: EntityManagementPage (RECOMENDADO)

| Componente | Ubicación | Responsabilidad |
|-----------|-----------|-----------------|
| page.tsx | `/clinic/medical-records/` | State + handlers |
| CreateMedicalVisitModal | `/components/` | Create form |
| EditMedicalVisitModal | `/components/` | Edit form |
| DeleteMedicalVisitConfirmation | `/components/` | Delete confirm |
| MedicalVisitCard | `/components/platform/` | Card view |
| MedicalVisitsTable | `/components/platform/` | Table view |
| medicalVisitsConfig.ts | `/config/` | Configuración declarativa |
| **Total Líneas** | | ~500 LOC |
| **Reutilización** | | ✅ ~60% (EntityManagementPage) |

---

## 🏗️ Componentes Faltantes - Plan de Implementación

### Fase 1: INFRAESTRUCTURA (CRÍTICA)

#### 1.1. `src/types/ehr.ts` - ❌ INEXISTENTE
```typescript
// Interfaces para:
export interface MedicalVisit {
  id: string;
  clinicId: string;
  petId: string;
  veterinarianId: string;
  reasonForVisit: 'CHECKUP' | 'VACCINATION' | 'DIAGNOSIS' | 'FOLLOW_UP' | 'OTHER';
  chiefComplaint: string;
  weight: number;
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: string;
  bodyConditionScore: number;
  generalNotes: string;
  preliminaryDiagnosis: string;
  treatmentPlan: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED';
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription { /* ... */ }
export interface Vaccination { /* ... */ }
export interface MedicationAllergy { /* ... */ }
export interface DiagnosticOrder { /* ... */ }
```

**Tamaño estimado:** ~400 líneas

---

#### 1.2. `src/api/ehr-api.ts` - ❌ INEXISTENTE
```typescript
// Singleton API service con 20+ métodos:

// Medical Visits
export const ehrApi = {
  // VISITS
  createMedicalVisit: async (data) => { /* POST /api/medical-visits */ },
  getMedicalVisit: async (id) => { /* GET /api/medical-visits/:id */ },
  listMedicalVisits: async (filters) => { /* GET /api/medical-visits */ },
  updateMedicalVisit: async (id, data) => { /* PUT /api/medical-visits/:id */ },
  updateMedicalVisitStatus: async (id, status) => { /* PATCH .../status */ },
  deleteMedicalVisit: async (id) => { /* DELETE /api/medical-visits/:id */ },
  signMedicalRecord: async (id, data) => { /* POST .../sign */ },
  
  // DIAGNOSES
  addDiagnosis: async (visitId, data) => { /* POST .../diagnoses */ },
  getDiagnosesByVisit: async (visitId) => { /* GET .../diagnoses */ },
  
  // PRESCRIPTIONS (10+ métodos)
  // VACCINATIONS (8+ métodos)
  // ALLERGIES (5+ métodos)
  // DIAGNOSTIC ORDERS (7+ métodos)
};
```

**Tamaño estimado:** ~450 líneas

---

#### 1.3. `src/store/ehr-store.ts` - ❌ INEXISTENTE
```typescript
// Zustand store con:
export const useEhrStore = create((set) => ({
  // State
  medicalVisits: [],
  selectedVisit: null,
  isLoadingVisits: false,
  visitsError: null,
  petPrescriptions: [],
  petVaccinations: [],
  petAllergies: [],
  petOverdueVaccinations: [],
  showCreateModal: false,
  showEditModal: false,
  showDeleteConfirmation: false,
  
  // Actions (25+)
  fetchMedicalVisits: async (filters) => { /* ... */ },
  createMedicalVisit: async (data) => { /* ... */ },
  updateMedicalVisit: async (id, data) => { /* ... */ },
  deleteMedicalVisit: async (id) => { /* ... */ },
  signMedicalRecord: async (id, data) => { /* ... */ },
  // ... más
}));
```

**Tamaño estimado:** ~500 líneas

---

### Fase 2: CONFIGURACIÓN (NUEVO - NO DOCUMENTADO)

#### 2.1. `src/config/medicalVisitsConfig.ts` - 🆕 RECOMENDADO
```typescript
import { EntityConfig } from '@/components/entity-kit';
import { MedicalVisit } from '@/types/ehr';

export const medicalVisitsConfig: EntityConfig<MedicalVisit> = {
  entityNameSingular: 'Visita Médica',
  entityNamePlural: 'Visitas Médicas',
  
  pageHeader: {
    title: 'Registros Médicos',
    subtitle: 'Gestiona las visitas médicas de tus pacientes',
    breadcrumbs: [
      { label: 'Clínica', href: '/clinic' },
      { label: 'Registros Médicos' }
    ],
    primaryAction: {
      label: '+ Nueva Visita',
      onClick: () => {}, // Manejado en page.tsx
    }
  },
  
  // 🎯 KPIs DINÁMICOS
  kpis: (data: MedicalVisit[]) => [
    {
      label: 'Total de Visitas',
      value: data.length,
      icon: MdMedicalServices,
      color: 'primary',
    },
    {
      label: 'Visitas Completadas',
      value: data.filter(v => v.status === 'COMPLETED').length,
      icon: MdCheckCircle,
      color: 'success',
    },
    {
      label: 'Visitas Firmadas',
      value: data.filter(v => v.status === 'SIGNED').length,
      icon: MdSignature,
      color: 'primary',
    },
    {
      label: 'En Borrador',
      value: data.filter(v => v.status === 'DRAFT').length,
      icon: MdDraft,
      color: 'warning',
    },
  ],
  
  // Card adapter
  cardAdapter: (visit: MedicalVisit) => ({
    id: visit.id,
    title: `${visit.reasonForVisit} - ${visit.chiefComplaint}`,
    subtitle: formatInClinicTz(visit.createdAt),
    status: visit.status,
    // ... más campos
  }),
  
  // Table columns
  tableColumns: [
    { header: 'Tipo', accessorKey: 'reasonForVisit' },
    { header: 'Motivo', accessorKey: 'chiefComplaint' },
    { header: 'Fecha', accessorKey: 'createdAt', cell: (date) => formatInClinicTz(date) },
    { header: 'Estado', accessorKey: 'status' },
    { header: 'Temperatura', accessorKey: 'temperature' },
  ],
};
```

**Tamaño estimado:** ~200 líneas

---

### Fase 3: COMPONENTES DE UI (MODALES)

#### 3.1. `src/components/CreateMedicalVisitModal.tsx` - ❌ INEXISTENTE
```typescript
// Formulario de creación
// - Header con gradient primary
// - Secciones: Basic Info, Vital Signs, Clinical Notes, Follow-up
// - Validaciones
// - Estado de carga
// - Toast notifications

interface CreateMedicalVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (visit: MedicalVisit) => void;
  petId?: string;
  appointmentId?: string;
}
```

**Tamaño estimado:** ~350 líneas

---

#### 3.2. `src/components/EditMedicalVisitModal.tsx` - ❌ INEXISTENTE
```typescript
// Idéntico a Create pero:
// - Recibe visit seleccionada
// - Precarga formulario con datos
// - Solo edita visitas DRAFT
// - Header "Editar Visita"

interface EditMedicalVisitModalProps {
  isOpen: boolean;
  visit: MedicalVisit | null;
  onClose: () => void;
  onSuccess?: (visit: MedicalVisit) => void;
}
```

**Tamaño estimado:** ~350 líneas (casi igual a Create)

---

#### 3.3. `src/components/DeleteMedicalVisitConfirmation.tsx` - ❌ INEXISTENTE
```typescript
// Confirmación con:
// - Header rojo con warning icon
// - Detalles de la visita
// - Botones Cancelar/Eliminar

interface DeleteMedicalVisitConfirmationProps {
  isOpen: boolean;
  visit: MedicalVisit | null;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Tamaño estimado:** ~250 líneas

---

### Fase 4: COMPONENTES DE VISTA (DISPLAY)

#### 4.1. `src/components/platform/MedicalVisitCard.tsx` - ❌ INEXISTENTE
```typescript
// Card de 384px de altura (h-96)
// - Header con gradient dinámico según status
// - Status badge
// - Información de visita
// - Grid mini de vitales
// - Alert de seguimiento
// - Menu de acciones (Edit/Complete/Delete)

interface MedicalVisitCardProps {
  visit: MedicalVisit;
  onEdit?: (visit: MedicalVisit) => void;
  onDelete?: (visit: MedicalVisit) => void;
  onStatusChange?: (id: string, status: string) => void;
}
```

**Tamaño estimado:** ~400 líneas

---

#### 4.2. `src/components/platform/MedicalVisitsTable.tsx` - ❌ INEXISTENTE
```typescript
// Tabla con columnas:
// - Tipo | Motivo | Fecha | Estado | Temperatura | Acciones
// - Filas con hover
// - Botones de acción en hover
// - Status badges
// - Responsive

interface MedicalVisitsTableProps {
  visits: MedicalVisit[];
  onEdit?: (visit: MedicalVisit) => void;
  onDelete?: (visit: MedicalVisit) => void;
  onStatusChange?: (id: string, status: string) => void;
}
```

**Tamaño estimado:** ~300 líneas

---

### Fase 5: PÁGINA PRINCIPAL

#### 5.1. `src/app/(protected)/clinic/medical-records/page.tsx` - ❌ INEXISTENTE

**OPCIÓN A: Manual (Como documentado)**
```typescript
// ~800 líneas
// Todo el estado, handlers, render en un archivo
// Difícil de mantener, no reutilizable
```

**OPCIÓN B: EntityManagementPage (RECOMENDADO)**
```typescript
// ~200 líneas
// Estado + handlers básicos
// Todo el render delegado a EntityManagementPage

import { EntityManagementPage } from '@/components/entity-kit';
import { medicalVisitsConfig } from '@/config/medicalVisitsConfig';
import { useEhrStore } from '@/store/ehr-store';

export default function MedicalRecordsPage() {
  // State
  const [medicalVisits, setMedicalVisits] = useState<MedicalVisit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Filtered & Sorted
  const filteredAndSorted = useMemo(() => {
    // Filtrado y ordenamiento
  }, [medicalVisits, searchTerm, sortBy]);

  return (
    <>
      <EntityManagementPage
        config={medicalVisitsConfig}
        data={medicalVisits}
        filteredData={filteredAndSorted}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        getRowActions={getRowActions}
        // ...
      />
      
      <CreateMedicalVisitModal />
      <EditMedicalVisitModal />
      <DeleteMedicalVisitConfirmation />
    </>
  );
}
```

**Tamaño estimado:** ~200 líneas vs ~800 de la opción manual

---

## 📦 Resumen: Componentes Faltantes Totales

```
INFRAESTRUCTURA (Fase 1)
├─ src/types/ehr.ts                           ❌ (400 LOC)
├─ src/api/ehr-api.ts                         ❌ (450 LOC)
└─ src/store/ehr-store.ts                     ❌ (500 LOC)

CONFIGURACIÓN (Fase 2) - 🆕 RECOMENDADO
└─ src/config/medicalVisitsConfig.ts          ❌ (200 LOC)

MODALES (Fase 3)
├─ src/components/CreateMedicalVisitModal.tsx ❌ (350 LOC)
├─ src/components/EditMedicalVisitModal.tsx   ❌ (350 LOC)
└─ src/components/DeleteMedicalVisitConfirmation.tsx ❌ (250 LOC)

VISTA (Fase 4)
├─ src/components/platform/MedicalVisitCard.tsx   ❌ (400 LOC)
└─ src/components/platform/MedicalVisitsTable.tsx ❌ (300 LOC)

PÁGINA (Fase 5)
└─ src/app/(protected)/clinic/medical-records/
   ├─ page.tsx   ❌ (200 LOC - EntityManagementPage)
   └─ layout.tsx ❌ (50 LOC)

TOTAL: ~5200 LOC (pero reutilizable gracias a EntityManagementPage)
```

---

## 🎯 Plan de Implementación Recomendado

### Priority 1: INFRAESTRUCTURA (BLOQUEA TODO)
1. ✅ `src/types/ehr.ts` - Types base
2. ✅ `src/api/ehr-api.ts` - API client
3. ✅ `src/store/ehr-store.ts` - State management

### Priority 2: CONFIG + MODALES (FUNCIONALIDAD)
4. ✅ `src/config/medicalVisitsConfig.ts` - 🆕 Recomendado
5. ✅ `src/components/CreateMedicalVisitModal.tsx`
6. ✅ `src/components/EditMedicalVisitModal.tsx`
7. ✅ `src/components/DeleteMedicalVisitConfirmation.tsx`

### Priority 3: VISTA (UI)
8. ✅ `src/components/platform/MedicalVisitCard.tsx`
9. ✅ `src/components/platform/MedicalVisitsTable.tsx`

### Priority 4: PÁGINA (INTEGRACIÓN)
10. ✅ `src/app/(protected)/clinic/medical-records/page.tsx`
11. ✅ `src/app/(protected)/clinic/medical-records/layout.tsx`

---

## 🔄 Diferencias: Especificación vs Recomendación

### ❌ Lo Que DICE EHR_FRONTEND_IMPLEMENTATION.md
- Página con todo el estado local
- Modales 3 separados
- Componentes MedicalVisitCard + Table sin config
- Sin KPIs dinámicos
- Sin búsqueda/filtros reutilizables
- Stats bar manual

### ✅ Lo Que DEBERÍA Hacer (EntityManagementPage)
- Usar EntityManagementPage (arquitectura profesional)
- Crear medicalVisitsConfig.ts (declarativo)
- KPIs calculados dinámicamente desde config
- Búsqueda + Filtros + Ordenamiento auto
- Page.tsx más simple (~200 vs ~800 LOC)
- Reutilizable para otros módulos
- Escalable y mantenible

---

## 📊 Comparativa Final

| Aspecto | Especificación (Manual) | Recomendación (EntityKit) |
|--------|-------------------------|---------------------------|
| **Total LOC** | ~2600 | ~2400 |
| **Reutilización** | ❌ 0% | ✅ ~60% |
| **KPIs** | Manual | Dinámico |
| **Búsqueda** | NO | SÍ |
| **Filtros** | NO | SÍ |
| **Ordenamiento** | NO | SÍ |
| **Mantenimiento** | Difícil | Fácil |
| **Escalabilidad** | Pobre | Excelente |
| **time-to-implement** | ~3 días | ~2 días |

---

## 🚀 CONCLUSIÓN

**La especificación en EHR_FRONTEND_IMPLEMENTATION.md está CORRECTA en componentes, pero SUBÓPTIMA en arquitectura.**

### RECOMENDACIÓN FINAL:
1. Seguir todos los componentes documentados ✅
2. Agregar `medicalVisitsConfig.ts` (Fase 2) 🆕
3. **Usar EntityManagementPage en lugar de lógica manual en page.tsx**
4. Reducir ~200 LOC y ganador reutilización global
5. Mantener los mismos KPIs y UX/UI

**Resultado:** Sistema profesional, escalable y mantenible que sigue los estándares del proyecto (Clientes, Mascotas, etc).

---

**Estado recomendado:** READY TO IMPLEMENT  
**Prioridad:** 🔴 CRÍTICA (EHR es feature clave del proyecto)  
**Dependencias:** Backend API completamente funcional ✅
