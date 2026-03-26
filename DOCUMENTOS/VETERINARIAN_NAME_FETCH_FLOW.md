# Medical History Page - Veterinarian Name Fetch Flow

## Complete Implementation Overview

The medical-history page fetches and displays veterinarian names assigned to appointments through a combination of API calls, caching, and async state management.

---

## 1. API ENDPOINT & METHOD

### Endpoint
```
GET /api/clinics/:clinicId/users/:userId
```

### Implementation in `clinic-users-api.ts`
```typescript
/**
 * GET /api/clinics/:clinicId/users/:userId
 * Get a single user by ID
 */
async getUser(userId: string): Promise<ClinicUser> {
  try {
    const clinicId = getClinicId();
    const response = await api.get(`/clinics/${clinicId}/users/${userId}`);
    const user = (response.data || response) as ClinicUser;
    return user;
  } catch (error: any) {
    console.error('[ClinicUsersApi] Error fetching user:', error);
    throw error;
  }
}
```

### API Client Used
- **File**: `src/lib/api-client.ts`
- **Base URL**: `/api` (relative path - uses Next.js proxy rewrite)
- **Instance**: Axios with:
  - baseURL: `/api`
  - timeout: 30000ms
  - credentials: enabled (withCredentials: true)
  - Auto token injection in Authorization header

---

## 2. CACHING MECHANISM

### Cache Implementation
```typescript
// State: Medical-history page (lines 50-51)
const [userCache, setUserCache] = useState<Map<string, string>>(new Map());
```

### Cache Structure
- **Type**: `Map<string, string>`
- **Key**: User ID (string)
- **Value**: User name (string)
- **Scope**: Component state (persists during component mount)

### Cache Lookup & Storage
```typescript
const getUserName = async (userId: string | null | undefined): Promise<string> => {
  if (!userId) return 'N/A';
  
  // STEP 1: Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId) || 'N/A';
  }
  
  try {
    // STEP 2: If not in cache, fetch from API
    const user = await clinicUsersApi.getUser(userId);
    const userName = (user as any).name || (user as any).email || 'N/A';
    
    // STEP 3: Store in cache for future use
    setUserCache((prev) => new Map(prev).set(userId, userName));
    return userName;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return 'N/A';
  }
};
```

### Cache Benefits
✅ **Deduplication**: Same user ID fetches only once during component lifecycle
✅ **Performance**: Immediate return for cached names (O(1) lookup)
✅ **Prevents Re-fetching**: Multiple appointments with same vet fetch name once

---

## 3. COMPLETE VETERINARIAN NAME DISPLAY FLOW

### Data Flow Diagram
```
Appointment.assigned_staff_user_id (UUID)
    ↓
[Medical History Page Component]
    ↓
loadMedicalHistory() useEffect (triggered on load)
    ↓
For each appointment:
    ├─ Fetch appointment from appointmentsApi.getAppointments()
    ├─ Extract assigned_staff_user_id field
    ├─ Call getUserName(assigned_staff_user_id)
    │   ├─ Check userCache (Map)
    │   ├─ If not found: Call clinicUsersApi.getUser(userId)
    │   │   └─ GET /api/clinics/:clinicId/users/:userId
    │   ├─ Extract name or email from response
    │   └─ Store in userCache
    └─ Create MedicalHistoryRecord with veterinarian name
        └─ Display in table with "👨‍⚕️ Veterinario" column
```

### Step-by-Step Execution

#### Step 1: Initialize Page & State
```typescript
// Page component initialization
const [records, setRecords] = useState<MedicalHistoryRecord[]>([]);
const [userCache, setUserCache] = useState<Map<string, string>>(new Map());
const [loading, setLoading] = useState(true);
```

#### Step 2: Trigger Data Load
```typescript
useEffect(() => {
  if (clinicId) {
    loadMedicalHistory(); // Triggered on mount and filter changes
  }
}, [filterStatus, dateFrom, dateTo, clinicId]);
```

#### Step 3: Fetch Appointments
```typescript
const loadMedicalHistory = async () => {
  try {
    setLoading(true);
    
    // Get appointments with optional filters
    const filters: any = {
      status: filterStatus !== 'ALL' ? filterStatus : undefined,
      startDate: dateFrom || undefined,
      endDate: dateTo || undefined,
    };
    
    const response = await appointmentsApi.getAppointments(filters);
    const appointments = response.data || response;
```

#### Step 4: Fetch Veterinarian Name for Each Appointment
```typescript
for (const apt of appointments) {
  // Filter for MEDICAL service type only
  if ((apt as any).service_type !== 'MEDICAL') {
    continue;
  }

  try {
    // CRITICAL: Fetch veterinarian name here
    const veterinarianName = await getUserName((apt as any).assigned_staff_user_id);
    
    // ... rest of enrichment ...
```

#### Step 5: Build Medical History Record
```typescript
enrichedRecords.push({
  appointmentId: apt.id,
  petName: apt.pet?.name || 'N/A',
  petId: petId!,
  clientName: apt.client?.name || 'N/A',
  clientId: apt.client?.id || '',
  visitDate: apt.scheduled_at || new Date().toISOString(),
  status: apt.status as 'COMPLETED' | 'IN_PROGRESS' | 'DRAFT',
  veterinarian: veterinarianName,  // ← STORED HERE
  diagnosis: (visit as any).diagnosis || '',
  prescriptions: visitPrescriptions.length,
  vaccinations: visitVaccinations.length,
  diagnostics: visitDiagnostics.length,
  notes: (visit as any).notes || '',
});
```

#### Step 6: Display in Table
```typescript
// Table column definition for veterinarian
{
  key: 'veterinarian',
  header: '👨‍⚕️ Veterinario',
  render: (value: string) => value || 'N/A',
}

// Renders as: "Dr. Juan Pérez" or "N/A"
```

---

## 4. HOOKS USED

### `useState` (React State Management)
1. **records**: `MedicalHistoryRecord[]` - All loaded medical history records
2. **userCache**: `Map<string, string>` - User name cache (userId → userName)
3. **loading**: `boolean` - Loading state indicator
4. **searchTerm**: `string` - Search filter input
5. **filterStatus**: Appointment status filter
6. **dateFrom/dateTo**: Date range filters
7. **selectedRecord**: Selected record for modal display
8. **isModalOpen**: Modal visibility state

### `useEffect` (Side Effects - Data Fetching)
```typescript
useEffect(() => {
  if (clinicId) {
    loadMedicalHistory();
  }
}, [filterStatus, dateFrom, dateTo, clinicId]);
```

**Triggers**: 
- Component mount
- When filterStatus changes
- When dateFrom changes
- When dateTo changes
- When clinicId changes

### `useRouter` (Navigation)
```typescript
const router = useRouter();
// Used for: router.back() and router.push()
```

### `useAuthStore` (Global Auth State)
```typescript
const { user } = useAuthStore();
const clinicId = user?.clinic_id;
// Used to get clinic context for API calls
```

---

## 5. ERROR HANDLING

The `getUserName` function has built-in error handling:

```typescript
try {
  const user = await clinicUsersApi.getUser(userId);
  const userName = (user as any).name || (user as any).email || 'N/A';
  setUserCache((prev) => new Map(prev).set(userId, userName));
  return userName;
} catch (error) {
  console.error(`Error fetching user ${userId}:`, error);
  return 'N/A';  // Graceful fallback
}
```

**Failure Scenarios**:
- ❌ User ID invalid → API returns 404 → Caught, returns "N/A"
- ❌ Network error → Caught, returns "N/A"
- ❌ User ID null/undefined → Early return "N/A"
- ❌ No name/email in response → Falls back to "N/A"

---

## 6. TYPE DEFINITIONS

### MedicalHistoryRecord
```typescript
interface MedicalHistoryRecord {
  appointmentId: string;
  petName: string;
  petId: string;
  clientName: string;
  clientId: string;
  visitDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'DRAFT';
  veterinarian?: string;  // ← User name from getUserName()
  diagnosis?: string;
  prescriptions: number;
  vaccinations: number;
  diagnostics: number;
  notes?: string;
}
```

### ClinicUser (API Response)
```typescript
// From src/types/index.ts
interface ClinicUser {
  id: string;
  name: string;      // ← Used for display
  email: string;     // ← Fallback if name missing
  // ... other fields
}
```

### Appointment
```typescript
interface Appointment {
  id: string;
  assigned_staff_user_id?: string;  // ← UUID of veterinarian/staff
  status: 'COMPLETED' | 'IN_PROGRESS' | 'DRAFT';
  scheduled_at: string;
  service_type: 'MEDICAL' | 'GROOMING';
  pet?: { id: string; name: string };
  client?: { id: string; name: string };
  // ... other fields
}
```

---

## 7. CACHING PERFORMANCE ANALYSIS

### Example Scenario
If a clinic has 10 completed appointments with 3 unique veterinarians:

**Without Caching**:
- Total API calls: 10 (one per appointment)
- Duplicate fetches: 7 (same 3 vets fetched multiple times)

**With Caching**:
- Total API calls: 3 (one per unique vet)
- Duplicate fetches: 0
- **Improvement**: 70% fewer API calls ✅

### Memory Considerations
- Each cache entry: ~100 bytes (user ID + name strings)
- 1000 users: ~100KB in memory
- Cleared when component unmounts (no memory leak)

---

## 8. KEY FILES INVOLVED

| File | Purpose |
|------|---------|
| `src/app/(protected)/clinic/medical-history/page.tsx` | Main page component with cache & UI |
| `src/api/clinic-users-api.ts` | `getUser()` method for API calls |
| `src/lib/api-client.ts` | Axios instance with token injection |
| `src/lib/api.ts` | Export wrapper for API client |
| `src/types/index.ts` | Type definitions (ClinicUser, Appointment, etc) |

---

## 9. SUMMARY TABLE

| Aspect | Implementation |
|--------|-----------------|
| **Fetch Method** | `clinicUsersApi.getUser(userId)` |
| **API Endpoint** | `GET /api/clinics/:clinicId/users/:userId` |
| **Cache Type** | `Map<string, string>` (component state) |
| **Cache Scope** | Component mount duration |
| **Cache Lookup** | O(1) time complexity (Map.has()) |
| **Fallback** | "N/A" for errors or missing data |
| **Request Method** | Axios HTTP GET |
| **Error Handling** | Try-catch with console logging |
| **UI Display** | Table column "👨‍⚕️ Veterinario" |
| **Triggers** | useEffect on filter/date changes |

