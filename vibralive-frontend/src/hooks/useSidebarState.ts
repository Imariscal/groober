import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStateStore {
  expandedSections: Record<string, boolean>;
  collapseSidebar: boolean;
  toggleSection: (sectionId: string) => void;
  setCollapseSidebar: (collapsed: boolean) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export const useSidebarState = create<SidebarStateStore>()(
  persist(
    (set) => ({
      expandedSections: {
        dashboard: true,
        data: true,
        admin: false,
        settings: false,
      },
      collapseSidebar: false,

      toggleSection: (sectionId: string) =>
        set((state) => ({
          expandedSections: {
            ...state.expandedSections,
            [sectionId]: !state.expandedSections[sectionId],
          },
        })),

      setCollapseSidebar: (collapsed: boolean) =>
        set({ collapseSidebar: collapsed }),

      expandAll: () =>
        set((state) => ({
          expandedSections: Object.keys(state.expandedSections).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {}
          ),
        })),

      collapseAll: () =>
        set((state) => ({
          expandedSections: Object.keys(state.expandedSections).reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {}
          ),
        })),
    }),
    {
      name: 'Groober-sidebar-state',
      version: 1,
    }
  )
);
