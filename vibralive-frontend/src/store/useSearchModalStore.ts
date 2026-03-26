import { create } from 'zustand';

export interface SearchModalState {
  modalType: 'client' | 'pet' | 'appointment' | null;
  entityId: string | null;
  petClientId?: string; // Para modales de mascotas, guardar el cliente propietario
  isOpen: boolean;

  openClientModal: (clientId: string) => void;
  openPetModal: (petId: string, clientId: string) => void;
  openAppointmentModal: (appointmentId: string) => void;
  closeModal: () => void;
}

export const useSearchModalStore = create<SearchModalState>((set) => ({
  modalType: null,
  entityId: null,
  petClientId: undefined,
  isOpen: false,

  openClientModal: (clientId) =>
    set({
      modalType: 'client',
      entityId: clientId,
      petClientId: undefined,
      isOpen: true,
    }),

  openPetModal: (petId, clientId) =>
    set({
      modalType: 'pet',
      entityId: petId,
      petClientId: clientId,
      isOpen: true,
    }),

  openAppointmentModal: (appointmentId) =>
    set({
      modalType: 'appointment',
      entityId: appointmentId,
      petClientId: undefined,
      isOpen: true,
    }),

  closeModal: () =>
    set({
      modalType: null,
      entityId: null,
      petClientId: undefined,
      isOpen: false,
    }),
}));
