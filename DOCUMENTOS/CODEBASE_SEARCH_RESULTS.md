# VibraLive Frontend - Medical Appointments & EHR Data Flow Analysis

## 1. KEY COMPONENTS & FILE PATHS

### 📋 Medical Visit Creation/Editing (NEW Medical History)

#### Primary Component: `MedicalVisitDetailView`
- **File Path**: [src/components/ehr/MedicalVisitDetailView.tsx](src/components/ehr/MedicalVisitDetailView.tsx)
- **Purpose**: Main component for capturing/viewing complete medical history for appointments
- **Modes**:
  - `capture` (default): Edit form, capture data, complete appointment
  - `view`: Read-only display, no editing
- **Lines**: ~500+ lines
- **Key Features**:
  - Loads full pet medical history on mount
  - Inline form for creating/editing medical visits
  - Tabs for Prescriptions, Vaccinations, Allergies, Diagnostics, Procedures, Follow-ups
  - Handles appointment status (CANCELLED shows alert, COMPLETED is read-only)

#### Modal Components for CRUD:
1. **CreateMedicalVisitModal** 
   - File: [src/components/CreateMedicalVisitModal.tsx](src/components/CreateMedicalVisitModal.tsx)
   - Creates NEW medical visits (not attached to appointments initially)
   - Has edit mode built-in

2. **EditMedicalVisitModal**
   - File: [src/components/EditMedicalVisitModal.tsx](src/components/EditMedicalVisitModal.tsx)
   - Edits EXISTING medical visits
   - Reuses same validation as MedicalVisitDetailView

---

### 📅 Visits List Display (/clinic/visits)

#### Detail Page for Specific Appointment
- **File Path**: [src/app/(protected)/clinic/visits/[appointmentId]/page.tsx](src/app/(protected)/clinic/visits/[appointmentId]/page.tsx)
- **Route**: `/clinic/visits/[appointmentId]`
- **Purpose**: 
  - Loads appointment details
  - Routes to MedicalVisitDetailView if MEDICAL service type
  - Routes to GroomingAppointmentDetailView if GROOMING service type
- **Flow**:
  1. Extracts `appointmentId` from URL params
  2. Calls `appointmentsApi.getAppointment(appointmentId)`
  3. Shows loading/error states
  4. Renders appropriate detail component based on `appointment.service_type`

#### List View Component
- **File Path**: [src/app/(protected)/clinic/visits/components/visits-list-view.tsx](src/app/(protected)/clinic/visits/components/visits-list-view.tsx)
- **Purpose**: Display list of appointments for selected day
- **Key Features**:
  - Calendar day selection
  - Filters for MEDICAL appointments only
  - Shows appointment status badges (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
  - Right-click context menu
  - Loads last medical visit for selected appointment
  - Action buttons: Start Visit, Complete, Assign Veterinarian, Cancel

#### Main Visits Page
- **File Path**: [src/app/(protected)/clinic/visits/page.tsx](src/app/(protected)/clinic/visits/page.tsx)
- **Note**: Currently redirects to `/clinic/grooming/page.tsx` (grooming page doubles as visits page)

---

## 2. DATA FLOW: How Medical History is Loaded

### 🔄 Complete Flow for NEW Medical Appointments

```
User navigates to /clinic/visits/{appointmentId}
    ↓
AppointmentDetailPage loads appointment via appointmentsApi.getAppointment(appointmentId)
    ↓
Renders MedicalVisitDetailView with appointment data
    ↓
MedicalVisitDetailView useEffect triggers:
    - Extracts petId from appointment.pet_id or appointment.pet.id
    - Calls ehrApi.getPetMedicalHistory(petId)
    - API Endpoint: GET /medical-visits/pet/{petId}/history
    ↓
Returns PetMedicalHistory object with:
    - pet: { id, name, species, breed, dateOfBirth }
    - medicalVisits: MedicalVisit[]  ← ALL PAST VISITS (Including old data issue)
    - prescriptions: Prescription[]
    - vaccinations: Vaccination[]
    - allergies: MedicationAllergy[]
    - diagnosticOrders: DiagnosticOrder[]
    - summaries: totalVisits, lastVisitDate, overdueVaccinations, etc.
    ↓
Component determines if NEW visit:
    - hasNoPriorVisits = !data?.medicalVisits || data.medicalVisits.length === 0
    - setIsNewVisit(hasNoPriorVisits)
    ↓
Display form with:
    - Inline capture form for new medical data
    - Tabs showing read-only historical data (from medicalVisits array)
```

### 🔄 API Endpoints Used

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/medical-visits/pet/{petId}/history` | GET | Get complete medical history | `PetMedicalHistory` |
| `/medical-visits` | POST | Create new medical visit | `MedicalVisit` |
| `/medical-visits/{visitId}` | PUT | Update medical visit | `MedicalVisit` |
| `/medical-visits/{visitId}/status` | PATCH | Update visit status | `MedicalVisit` |
| `/appointments/{appointmentId}` | GET | Get appointment details | `Appointment` |
| `/appointments/{appointmentId}` | PUT | Update appointment (e.g., status) | `Appointment` |

---

## 3. KEY DATA STRUCTURES

### PetMedicalHistory (Full History Returned)
```typescript
{
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    dateOfBirth?: Date;
  };
  
  medicalVisits: MedicalVisit[];        // ⚠️ ALL VISITS (old & new)
  prescriptions: Prescription[];         // All active + inactive
  vaccinations: Vaccination[];           // All past vaccinations
  allergies: MedicationAllergy[];        // All known allergies
  diagnosticOrders: DiagnosticOrder[];   // All diagnostic orders
  
  // Summaries
  totalVisits: number;
  lastVisitDate?: Date;
  overdueVaccinations: Vaccination[];    // Only overdue
  activePrescriptions: Prescription[];   // Only active
  knownAllergies: string[];              // Allergy names
}
```

### CreateMedicalVisitDto (What gets posted)
```typescript
{
  petId: string;
  appointmentId: string;
  visitType: VisitType;        // 'CHECKUP' | 'VACCINATION' | 'SURGERY' | etc
  reasonForVisit?: string;
  chiefComplaint: string;
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bloodPressure?: string;
  bodyConditionScore?: number;
  coatCondition?: string;
  generalNotes?: string;
  preliminaryDiagnosis?: string;
  treatmentPlan?: string;
  finalDiagnosis?: string;
  prognosis?: string;
  followUpRequired?: boolean;
}
```

### Appointment Type
```typescript
{
  id: string;
  pet_id: string;
  pet?: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    date_of_birth?: string;
  };
  client: Client;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduled_at: string (ISO datetime);
  service_type: 'MEDICAL' | 'GROOMING';
  reason?: string;
  notes?: string;
  duration_minutes: number;
  veterinarian_id?: string;
  location_type?: string;
  address_id?: string;
  // ... other fields
}
```

---

## 4. ISSUE: OLD DATA BEING LOADED

### The Problem Location

**File**: [src/components/ehr/MedicalVisitDetailView.tsx](src/components/ehr/MedicalVisitDetailView.tsx) **Lines 121-160**

```typescript
const loadMedicalHistory = async () => {
  // ... 
  const data = await ehrApi.getPetMedicalHistory(petId);  // ← LOADS ALL HISTORY
  
  setMedicalHistory(data);
  
  // Check if this is a new visit (no prior medical visits)
  const hasNoPriorVisits = !data?.medicalVisits || data.medicalVisits.length === 0;
  setIsNewVisit(hasNoPriorVisits);  // ← Sets correctly
};
```

**Issue**: 
- `getPetMedicalHistory()` returns **ALL medicalVisits** from the database
- The component loads the FULL history into tabs/display
- When creating NEW visit on existing appointment, old data appears in read-only tabs below capture form
- `medicalVisits` array includes all past visits, not filtered for this appointment

### Root Cause
- Backend endpoint `/medical-visits/pet/{petId}/history` returns complete pet history
- No filtering for current appointment
- No distinction between "historical data for reference" vs "data being edited now"

---

## 5. DATA LOADING COMPONENTS & TABS

### Medical Data Tabs (Read-Only Display of Historical Data)

Each tab loads from the returned `PetMedicalHistory`:

| Tab | Component File | Data Source | Displays |
|-----|---------------|-------------|----------|
| Prescriptions | [PrescriptionsTab.tsx](src/components/ehr/PrescriptionsTab.tsx) | `medicalHistory.prescriptions` | All prescriptions (active + inactive) |
| Vaccinations | [VaccinationsTab.tsx](src/components/ehr/VaccinationsTab.tsx) | `medicalHistory.vaccinations` | All vaccinations history |
| Allergies | [AllergiesTab.tsx](src/components/ehr/AllergiesTab.tsx) | `medicalHistory.allergies` | All known allergies |
| Diagnostics | [DiagnosticsTab.tsx](src/components/ehr/DiagnosticsTab.tsx) | `medicalHistory.diagnosticOrders` | All diagnostic orders |
| Procedures | [ProceduresTab.tsx](src/components/ehr/ProceduresTab.tsx) | Embedded in medical visit | - |
| Follow-ups | [FollowUpNotesTab.tsx](src/components/ehr/FollowUpNotesTab.tsx) | Embedded in medical visit | - |

### How Each Tab Works

**Pattern** (All tabs follow same CRUD pattern using `useCRUD` hook):

```typescript
const {
  data: displayData,         // Filtered/displayed data
  loading,
  isModalOpen,
  selectedItem,
  handleNew,                 // Open create modal
  handleEdit,                // Open edit modal
  handleDelete,              // Delete item
  handleSubmit,              // Save (create or update)
} = useCRUD<DataType>({
  onCreate: async (formData) => {
    // Call API to create
    await ehrApi.createX(medicalVisitId, formData);
  },
  onUpdate: async (id, formData) => {
    // Call API to update
    await ehrApi.updateX(id, formData);
  },
  // ...
});
```

---

## 6. API CLIENT & REQUEST PATTERNS

### File: [src/api/ehr-api.ts](src/api/ehr-api.ts)

**Key Function**:
```typescript
export const getPetMedicalHistory = async (petId: string): Promise<PetMedicalHistory> => {
  try {
    const url = `${MEDICAL_VISITS_API}/pet/${petId}/history`;
    // MEDICAL_VISITS_API = '/medical-visits'
    
    const medicalHistory = await apiClient.get<PetMedicalHistory>(url);
    return medicalHistory;
  } catch (error: any) {
    console.error('[EHR API] Error getting medical history for pet', petId, error);
    throw new Error(error?.response?.data?.message || 'Error al cargar el historial médico');
  }
};
```

**API Client Setup** (from [src/lib/api-client.ts](src/lib/api-client.ts)):
- Base URL: `/api` (relative path)
- Proxied through Next.js to backend at `http://localhost:3001`
- Returns `response.data` directly (not full response)
- Timeout: 30 seconds

---

## 7. VISITS LIST VIEW - Data Loading

### File: [src/app/(protected)/clinic/visits/components/visits-list-view.tsx](src/app/(protected)/clinic/visits/components/visits-list-view.tsx)

**How appointments are fetched**:

```typescript
const { appointments, isLoading, refetch } = useAppointmentsRangeQuery({
  start: startOfToday,
  end: endOfToday,
  clinicTimezone: timezone,
  serviceType: 'MEDICAL',  // Only medical appointments
});
```

**When an appointment is selected**:
```typescript
useEffect(() => {
  if (!selectedAppointment?.pet_id) return;
  
  const loadMedicalHistory = async () => {
    const response = await ehrApi.getPetMedicalHistory(
      selectedAppointment.pet_id
    );
    if (response?.medicalVisits?.length > 0) {
      setLastVisitData(response.medicalVisits[0]);  // Get LAST (most recent)
    }
  };
  
  loadMedicalHistory();
}, [selectedAppointment?.pet_id]);
```

**Problem**: Shows most recent visit, could be from different appointment

---

## 8. STATE MANAGEMENT

### Zustand Store: [src/store/ehr-store.ts](src/store/ehr-store.ts)

```typescript
interface EhrStore {
  // Medical Visits
  medicalVisits: MedicalVisit[];
  selectedVisit: MedicalVisit | null;
  isLoadingVisits: boolean;
  visitsError: string | null;
  
  // Pet Medical Data
  petMedicalHistory: PetMedicalHistory | null;
  petPrescriptions: Prescription[];
  petVaccinations: Vaccination[];
  petAllergies: MedicationAllergy[];
  petOverdueVaccinations: Vaccination[];
  isLoadingPetData: boolean;
  petDataError: string | null;
  
  // UI State
  showCreateVisitModal: boolean;
  showEditVisitModal: boolean;
  editingVisit: MedicalVisit | null;
  
  // Actions
  createMedicalVisit: (data: CreateMedicalVisitDto) => Promise<MedicalVisit>;
  updateMedicalVisit: (id: string, data: Partial<CreateMedicalVisitDto>) => Promise<MedicalVisit>;
  fetchPetMedicalVisits: (petId: string) => Promise<void>;
  // ... many more
}
```

---

## 9. SUMMARY: FILE LOCATIONS & RESPONSIBILITIES

| Component/File | Path | Responsibility | Type |
|---|---|---|---|
| **MedicalVisitDetailView** | `src/components/ehr/MedicalVisitDetailView.tsx` | Main form for capturing NEW medical data | Component |
| **CreateMedicalVisitModal** | `src/components/CreateMedicalVisitModal.tsx` | Modal for creating medical visits | Component |
| **EditMedicalVisitModal** | `src/components/EditMedicalVisitModal.tsx` | Modal for editing medical visits | Component |
| **Appointment Detail Page** | `src/app/(protected)/clinic/visits/[appointmentId]/page.tsx` | Route handler, fetches appointment | Page |
| **Visits List View** | `src/app/(protected)/clinic/visits/components/visits-list-view.tsx` | List of appointments for selected day | Component |
| **Tabs (Prescriptions, etc)** | `src/components/ehr/PrescriptionsTab.tsx` etc | Display historical data from pet | Component |
| **EHR API** | `src/api/ehr-api.ts` | All HTTP calls to medical endpoints | Service |
| **Appointments API** | `src/lib/appointments-api.ts` | Appointment CRUD operations | Service |
| **EHR Types** | `src/types/ehr.ts` | TypeScript interfaces for EHR | Types |
| **EHR Store** | `src/store/ehr-store.ts` | Zustand state management | Store |

---

## 10. KEY OBSERVATIONS

✅ **What Works Well**:
1. Clear separation of concerns (API, components, store)
2. Proper TypeScript typing throughout
3. Modal pattern for CRUD operations
4. Tab-based organization for medical data
5. Error handling with user feedback

⚠️ **Issues Found**:
1. **OLD DATA LOADING**: When creating new medical visit, ALL historical data is loaded and displayed
2. **No filtering by appointment**: medicalVisits array includes visits from other appointments
3. **Duplicate API calls**: Medical history called in multiple places (MedicalVisitDetailView + VisitsListView)
4. **State not isolated**: formData includes appointment's old medical visits

🔧 **Data Flow Issues**:
1. Backend returns complete pet history, not filtered
2. No distinction between "data for reference" vs "NEW data being entered"
3. Needs filtering to show only NEW visit form for new appointments

---

## 11. API ENDPOINTS REFERENCE

```bash
# Get complete pet medical history (LOADS ALL OLD DATA)
GET /api/medical-visits/pet/{petId}/history

# Create new medical visit
POST /api/medical-visits
Body: CreateMedicalVisitDto

# Update medical visit
PUT /api/medical-visits/{visitId}
Body: Partial<CreateMedicalVisitDto>

# Update medical visit status
PATCH /api/medical-visits/{visitId}/status
Body: { status: 'COMPLETED', signedByVeterinarianId?: string }

# Get appointment details
GET /api/appointments/{appointmentId}

# Update appointment
PUT /api/appointments/{appointmentId}
Body: UpdateAppointmentPayload

# Create prescription (in medical visit)
POST /api/medical-visits/{medicalVisitId}/prescriptions

# List prescriptions
GET /api/medical-visits/{medicalVisitId}/prescriptions
```

---

## 12. NEXT STEPS FOR DEBUGGING

When investigating the "loading old appointment data incorrectly" issue, check:

1. **Backend Response**: What does `/medical-visits/pet/{petId}/history` actually return?
   - Is it returning ALL visits, or already filtered?
   - Are dates correct?

2. **Frontend Display Logic**: Does MedicalVisitDetailView properly distinguish between:
   - NEW visit form (for current appointment)
   - OLD visit data (historical reference in tabs)

3. **Form State**: Is `formData` being populated with old visit data?
   - Check lines 99-115 in MedicalVisitDetailView.tsx

4. **Tab Filtering**: Are tabs showing correct data?
   - Check each tab's `displayData` or `data` filtering logic

5. **API Calls**: How many times is `getPetMedicalHistory` called?
   - Check browser Network tab for duplicate calls
