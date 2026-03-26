import { useEffect } from 'react';
import { useSearchModalStore } from '@/store/useSearchModalStore';

/**
 * Hook que detecta si hay un modal pendiente de abrir desde la búsqueda global
 * Útil para páginas que manejan modales (clientes, citas, etc)
 */
export function useSearchModalTrigger(
  callbacks: {
    onOpenClient?: (clientId: string) => void;
    onOpenPet?: (petId: string, clientId: string) => void;
    onOpenAppointment?: (appointmentId: string) => void;
  }
) {
  const { modalType, entityId, petClientId, closeModal } = useSearchModalStore();

  useEffect(() => {
    if (!modalType || !entityId) return;

    // Llamar al callback correspondiente
    if (modalType === 'client' && callbacks.onOpenClient) {
      callbacks.onOpenClient(entityId);
    } else if (modalType === 'pet' && callbacks.onOpenPet && petClientId) {
      callbacks.onOpenPet(entityId, petClientId);
    } else if (modalType === 'appointment' && callbacks.onOpenAppointment) {
      callbacks.onOpenAppointment(entityId);
    }

    // Limpiar el estado
    closeModal();
  }, [modalType, entityId, petClientId, callbacks, closeModal]);
}
