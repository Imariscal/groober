/**
 * Pets Configuration
 * Maps the Pet entity to the EntityConfig<Pet> pattern
 * This allows PetsPage to use the generic EntityManagementPage component
 *
 * Pattern mirrors clientsConfig.ts for consistency
 */

import {
  MdPets,
  MdCategory,
  MdWc,
  MdCalendarToday,
  MdCheckCircle,
  MdHighlightOff,
  MdVaccines,
  MdPalette,
  MdNotes,
  MdWarningAmber,
  MdMonitor,
} from 'react-icons/md';
import { Pet, PetSpecies, PetSex } from '@/types';
import { EntityConfig, EntityCardModel, ColumnDef } from '@/components/entity-kit';
import { parseISO } from 'date-fns';

// Helper functions
const getSpeciesEmoji = (species: PetSpecies): string => {
  const emojis: Record<PetSpecies, string> = {
    DOG: '🐕',
    CAT: '🐈',
    BIRD: '🦜',
    RABBIT: '🐰',
    HAMSTER: '🐹',
    GUINEA_PIG: '🐹',
    FISH: '🐠',
    TURTLE: '🐢',
    FERRET: '🦡',
    OTHER: '🐾',
  };
  return emojis[species] || '🐾';
};

const getSpeciesLabel = (species: PetSpecies): string => {
  const labels: Record<PetSpecies, string> = {
    DOG: 'Perro',
    CAT: 'Gato',
    BIRD: 'Ave',
    RABBIT: 'Conejo',
    HAMSTER: 'Hámster',
    GUINEA_PIG: 'Cobaya',
    FISH: 'Pez',
    TURTLE: 'Tortuga',
    FERRET: 'Hurón',
    OTHER: 'Otro',
  };
  return labels[species] || 'Mascota';
};

const getSexLabel = (sex: PetSex): string => {
  const labels: Record<PetSex, string> = {
    MALE: 'Macho',
    FEMALE: 'Hembra',
    UNKNOWN: 'Desconocido',
  };
  return labels[sex] || 'Desconocido';
};

const getSexEmoji = (sex: PetSex): string => {
  const emojis: Record<PetSex, string> = {
    MALE: '♂️',
    FEMALE: '♀️',
    UNKNOWN: '❓',
  };
  return emojis[sex] || '❓';
};

const calculateAge = (dateOfBirth?: string): string => {
  if (!dateOfBirth) return 'N/A';

  try {
    // Parse the birth date - it comes as YYYY-MM-DD or ISO string
    const birthDate = parseISO(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 0) return 'N/A';
    if (age === 0) {
      const months = today.getMonth() - birthDate.getMonth();
      return months < 0
        ? 'Recién nacido'
        : months === 0
          ? '< 1 mes'
          : `${months}m`;
    }

    return `${age}a`;
  } catch {
    return 'N/A';
  }
};

/**
 * petsConfig
 * Defines how Pet entities are displayed and managed
 * Structure mirrors clientsConfig for consistency
 */
export const petsConfig: EntityConfig<Pet> = {
  // Metadata
  entityNameSingular: 'Mascota',
  entityNamePlural: 'Mascotas',

  // Page header configuration
  pageHeader: {
    title: 'Gestión de Mascotas',
    subtitle: 'Administra las mascotas de tus clientes',
    breadcrumbs: [
      { label: 'Clínica', href: '/clinic' },
      { label: 'Gestión de Mascotas' },
    ],
    primaryAction: {
      label: 'Nueva Mascota',
      onClick: () => {}, // Will be overridden by page
      icon: undefined,
    },
  },

  // KPI calculations from data
  kpis: (data: Pet[]) => {
    // Calculate stats
    const activeCount = data.filter((p) => !p.is_deceased).length;
    const deceasedCount = data.filter((p) => p.is_deceased).length;
    const sterilizedCount = data.filter((p) => p.is_sterilized).length;

    // Get most common species
    const speciesCounts = data.reduce(
      (acc, p) => {
        acc[p.species] = (acc[p.species] || 0) + 1;
        return acc;
      },
      {} as Record<PetSpecies, number>
    );
    const mostCommonSpecies = Object.entries(speciesCounts).sort(([, a], [, b]) => b - a)[0];

    return [
      {
        label: 'Total de Mascotas',
        value: data.length,
        icon: MdPets,
        color: 'primary',
      },
      {
        label: 'Mascotas Activas',
        value: activeCount,
        icon: MdCheckCircle,
        color: 'success',
      },
      {
        label: 'Especie Más Común',
        value: mostCommonSpecies ? getSpeciesLabel(mostCommonSpecies[0] as PetSpecies) : '-',
        icon: MdCategory,
        color: 'info',
      },
      {
        label: 'Esterilizadas',
        value: sterilizedCount,
        icon: MdVaccines,
        color: 'warning',
      },
    ];
  },

  // Card view adapter - transforms Pet to EntityCardModel
  cardAdapter: (pet: Pet): EntityCardModel => {
    const initials = pet.name.slice(0, 2).toUpperCase();

    return {
      id: pet.id,
      title: pet.name,
      subtitle: `${getSpeciesEmoji(pet.species)} ${getSpeciesLabel(pet.species)} • ID: ${pet.id.slice(0, 8)}...`,
      avatar: {
        text: initials,
      },
      status: {
        label: pet.is_deceased ? 'Fallecida' : 'Activa',
        color: pet.is_deceased ? 'danger' : 'success',
      },
      fields: [
        {
          icon: MdWc,
          label: 'Sexo',
          value: `${getSexEmoji(pet.sex)} ${getSexLabel(pet.sex)}`,
        },
        ...(pet.breed
          ? [
              {
                icon: MdCategory,
                label: 'Raza',
                value: pet.breed,
              },
            ]
          : []),
        ...(pet.date_of_birth
          ? [
              {
                icon: MdCalendarToday,
                label: 'Edad',
                value: calculateAge(pet.date_of_birth),
              },
            ]
          : []),
        ...(pet.color
          ? [
              {
                icon: MdPalette,
                label: 'Color',
                value: pet.color,
              },
            ]
          : []),
        ...(pet.is_sterilized
          ? [
              {
                icon: MdVaccines,
                label: 'Esterilizada',
                value: '✅',
              },
            ]
          : []),
      ],
      actions: [],
    };
  },

  // Table columns configuration
  tableColumns: [
    {
      key: 'name',
      label: 'Mascota',
      accessor: (pet: Pet) => {
        const emoji = getSpeciesEmoji(pet.species);
        return `${emoji} ${pet.name}`;
      },
      width: 'min-w-[180px]',
    },
    {
      key: 'species',
      label: 'Especie',
      accessor: (pet: Pet) => getSpeciesLabel(pet.species),
      width: 'min-w-[120px]',
    },
    {
      key: 'breed',
      label: 'Raza',
      accessor: (pet: Pet) => pet.breed || '-',
      width: 'min-w-[140px]',
    },
    {
      key: 'sex',
      label: 'Sexo',
      accessor: (pet: Pet) => `${getSexEmoji(pet.sex)} ${getSexLabel(pet.sex)}`,
      width: 'min-w-[100px]',
    },
    {
      key: 'age',
      label: 'Edad',
      accessor: (pet: Pet) => calculateAge(pet.date_of_birth),
      width: 'min-w-[80px]',
    },
    {
      key: 'sterilized',
      label: 'Esterilizada',
      accessor: (pet: Pet) => (pet.is_sterilized ? '✅ Sí' : '❌ No'),
      width: 'min-w-[110px]',
    },
    {
      key: 'color',
      label: 'Color',
      accessor: (pet: Pet) => pet.color || '-',
      width: 'min-w-[100px]',
    },
    {
      key: 'status',
      label: 'Estado',
      accessor: (pet: Pet) => {
        if (pet.is_deceased) return '⚫ Fallecida';
        return '✅ Activa';
      },
      width: 'min-w-[110px]',
    },
  ] as ColumnDef<Pet>[],

  // Toolbar configuration
  toolbar: {
    searchPlaceholder: 'Buscar mascota, raza, dueño...',
    enableFilters: true,
    enableSort: true,
    enableViewToggle: true,
  },

  // Filter and sort options
  filters: {
    sortOptions: [
      { label: 'Nombre A-Z', value: 'name-asc' },
      { label: 'Nombre Z-A', value: 'name-desc' },
      { label: 'Especie A-Z', value: 'species-asc' },
      { label: 'Especie Z-A', value: 'species-desc' },
      { label: 'Más recientes', value: 'created-desc' },
      { label: 'Más antiguos', value: 'created-asc' },
    ],
  },

  // View mode configuration
  defaultViewMode: 'table',
  supportedViewModes: ['cards', 'table'],
};
