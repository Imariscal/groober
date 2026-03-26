'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiAward, FiCalendar, FiArrowRight, FiSearch } from 'react-icons/fi';
import { GlobalSearchResult } from '@/hooks/useGlobalSearch';
import { useSearchModalStore } from '@/store/useSearchModalStore';

interface GlobalSearchDropdownProps {
  results: GlobalSearchResult;
  isLoading: boolean;
  isOpen: boolean;
  queryLength: number;
  onSelect?: () => void;
}

export function GlobalSearchDropdown({
  results,
  isLoading,
  isOpen,
  queryLength,
  onSelect,
}: GlobalSearchDropdownProps) {
  const router = useRouter();
  const { openClientModal, openPetModal, openAppointmentModal } = useSearchModalStore();
  const hasResults =
    results.clients.length > 0 ||
    results.pets.length > 0 ||
    results.appointments.length > 0;

  const handleClientClick = (clientId: string) => {
    openClientModal(clientId);
    router.push('/clinic/clients');
    onSelect?.();
  };

  const handlePetClick = (petId: string, clientId: string) => {
    openPetModal(petId, clientId);
    router.push('/clinic/pets');
    onSelect?.();
  };

  const handleAppointmentClick = (appointmentId: string) => {
    openAppointmentModal(appointmentId);
    router.push('/clinic/grooming');
    onSelect?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-[28rem] overflow-y-auto"
        >
          {isLoading && queryLength >= 2 && (
            <div className="px-4 py-8 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-600">Buscando...</span>
              </div>
            </div>
          )}

          {!isLoading && queryLength >= 2 && !hasResults && (
            <div className="px-4 py-8 text-center">
              <FiSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No se encontraron resultados</p>
            </div>
          )}

          {!isLoading && hasResults && (
            <>
              {/* Clientes */}
              {results.clients.length > 0 && (
                <div className="border-b border-slate-100 last:border-b-0">
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser className="w-4 h-4 text-primary-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Clientes
                      </span>
                    </div>
                    {results.clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleClientClick(client.id)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors group mb-1 last:mb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {client.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {client.matchType === 'phone' && client.phone}
                              {client.matchType === 'email' && client.email}
                            </p>
                          </div>
                          <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mascotas */}
              {results.pets.length > 0 && (
                <div className="border-b border-slate-100 last:border-b-0">
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FiAward className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Mascotas
                      </span>
                    </div>
                    {results.pets.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => handlePetClick(pet.id, pet.clientId)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors group mb-1 last:mb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {pet.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {pet.breed || pet.species} • {pet.clientName}
                            </p>
                          </div>
                          <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Citas */}
              {results.appointments.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCalendar className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Citas Próximas
                      </span>
                    </div>
                    {results.appointments.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => handleAppointmentClick(apt.id)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 transition-colors group mb-1 last:mb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {apt.clientName} • {apt.petName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {new Date(apt.scheduledAt).toLocaleDateString('es-MX', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {apt.reason && ` • ${apt.reason}`}
                            </p>
                          </div>
                          <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {queryLength > 0 && queryLength < 2 && (
            <div className="px-4 py-4 text-center">
              <p className="text-sm text-slate-500">
                Escribe al menos 2 caracteres para buscar
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
