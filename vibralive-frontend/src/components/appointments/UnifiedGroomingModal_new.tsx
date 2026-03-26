'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MdClose, MdCalendarToday, MdAccessTime, MdLocationOn, MdPerson, MdPets, MdCheckCircle } from 'react-icons/md';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Pet, Service, ClientAddress, ServicePackage, ClinicConfiguration, ClinicCalendarException, Appointment, Client } from '@/types';
import { pricingApi } from '@/api/pricing-api';
import { petsApi } from '@/lib/pets-api';
import { servicesApi } from '@/api/services-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { addressesApi } from '@/lib/addresses-api';
import { packagesApi } from '@/api/packages-api';
import { FormSelect, FormInput } from '@/components/FormFields';
import { ServicePicker } from './ServicePicker';
import { ClientAutocomplete } from './ClientAutocomplete';
import { addMinutes, format } from 'date-fns';
import toast from 'react-hot-toast';
import { isBookable, validateCapacity, getBusinessHoursForDate } from '@/lib/grooming-validation';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { toUtcIsoFromClinicLocal, getClinicDateKey } from '@/lib/datetime-tz';

// ... (incluyendo todas las interfaces y imports del archivo original)
// Por brevedad, copiaré la estructura del original pero mejoraré solo la parte visual del return

