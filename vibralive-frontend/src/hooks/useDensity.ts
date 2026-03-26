import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';

interface DensityConfig {
  spacing: {
    card: string;
    row: string;
    element: string;
  };
  fontSize: {
    body: string;
    label: string;
  };
  height: {
    input: string;
    button: string;
  };
}

const DENSITY_CONFIGS: Record<Density, DensityConfig> = {
  comfortable: {
    spacing: {
      card: 'p-6',
      row: 'py-4 px-6',
      element: 'gap-4',
    },
    fontSize: {
      body: 'text-base',
      label: 'text-sm',
    },
    height: {
      input: 'h-10',
      button: 'h-10',
    },
  },
  compact: {
    spacing: {
      card: 'p-4',
      row: 'py-2 px-4',
      element: 'gap-2',
    },
    fontSize: {
      body: 'text-sm',
      label: 'text-xs',
    },
    height: {
      input: 'h-8',
      button: 'h-8',
    },
  },
};

interface DensityStore {
  density: Density;
  toggleDensity: () => void;
  setDensity: (density: Density) => void;
  getConfig: () => DensityConfig;
  getSpacing: (key: keyof DensityConfig['spacing']) => string;
  getFontSize: (key: keyof DensityConfig['fontSize']) => string;
  getHeight: (key: keyof DensityConfig['height']) => string;
}

export const useDensityStore = create<DensityStore>()(
  persist(
    (set, get) => ({
      density: 'comfortable',

      toggleDensity: () =>
        set((state) => ({
          density: state.density === 'comfortable' ? 'compact' : 'comfortable',
        })),

      setDensity: (density: Density) => set({ density }),

      getConfig: () => DENSITY_CONFIGS[get().density],

      getSpacing: (key: keyof DensityConfig['spacing']) =>
        DENSITY_CONFIGS[get().density].spacing[key],

      getFontSize: (key: keyof DensityConfig['fontSize']) =>
        DENSITY_CONFIGS[get().density].fontSize[key],

      getHeight: (key: keyof DensityConfig['height']) =>
        DENSITY_CONFIGS[get().density].height[key],
    }),
    {
      name: 'Groober-density-store',
      version: 1,
    }
  )
);

/**
 * Custom hook to access density settings
 * @example
 * const { density, toggle, getSpacing } = useDensity();
 * const padding = getSpacing('card');
 */
export function useDensity() {
  const density = useDensityStore();

  return {
    density: density.density,
    toggle: density.toggleDensity,
    set: density.setDensity,
    getSpacing: density.getSpacing,
    getFontSize: density.getFontSize,
    getHeight: density.getHeight,
    getConfig: density.getConfig,
  };
}
