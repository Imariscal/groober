import { useState, useCallback, useRef } from 'react';
import { clientsApi } from '@/lib/clients-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { Client } from '@/types';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  clientId: string;
  clientName?: string;
}

export interface Appointment {
  id: string;
  scheduledAt: string;
  clientName: string;
  petName: string;
  status: string;
  reason?: string;
  locationType: string;
}

export interface GlobalSearchResult {
  clients: (Client & { matchType: 'name' | 'phone' | 'email' })[];
  pets: (Pet & { matchType: 'name' | 'breed' | 'owner' })[];
  appointments: (Appointment & { matchType: 'client' | 'pet' | 'service' })[];
}

export function useGlobalSearch() {
  const [results, setResults] = useState<GlobalSearchResult>({
    clients: [],
    pets: [],
    appointments: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const search = useCallback(async (query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.trim().length < 2) {
      setResults({
        clients: [],
        pets: [],
        appointments: [],
      });
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const normalizedQuery = query.toLowerCase().trim();

        // Fetch all clients to search locally
        const clientsResponse = await clientsApi.listClients(1, 100);
        const allClients = clientsResponse.data || [];

        // Search clients by name, phone, or email
        const matchingClients = allClients
          .filter((client) => {
            const name = client.name?.toLowerCase() || '';
            const phone = client.phone?.toLowerCase() || '';
            const email = client.email?.toLowerCase() || '';
            return (
              name.includes(normalizedQuery) ||
              phone.includes(normalizedQuery) ||
              email.includes(normalizedQuery)
            );
          })
          .slice(0, 5)
          .map((client) => {
            let matchType: 'name' | 'phone' | 'email' = 'name';
            const name = client.name?.toLowerCase() || '';
            const phone = client.phone?.toLowerCase() || '';
            const email = client.email?.toLowerCase() || '';

            if (email.includes(normalizedQuery)) {
              matchType = 'email';
            } else if (phone.includes(normalizedQuery)) {
              matchType = 'phone';
            }

            return { ...client, matchType };
          });

        // Search pets from the matched clients
        const matchingPets: (Pet & { matchType: 'name' | 'breed' | 'owner' })[] = [];
        allClients.forEach((client) => {
          if (client.pets && Array.isArray(client.pets)) {
            client.pets.forEach((pet: any) => {
              const petName = pet.name?.toLowerCase() || '';
              const breed = pet.breed?.toLowerCase() || '';
              const clientName = client.name?.toLowerCase() || '';

              if (
                petName.includes(normalizedQuery) ||
                breed.includes(normalizedQuery) ||
                clientName.includes(normalizedQuery)
              ) {
                let matchType: 'name' | 'breed' | 'owner' = 'name';
                if (breed.includes(normalizedQuery)) {
                  matchType = 'breed';
                } else if (clientName.includes(normalizedQuery)) {
                  matchType = 'owner';
                }

                matchingPets.push({
                  id: pet.id,
                  name: pet.name,
                  species: pet.species,
                  breed: pet.breed,
                  clientId: client.id,
                  clientName: client.name,
                  matchType,
                } as Pet & { matchType: 'name' | 'breed' | 'owner' });
              }
            });
          }
        });

        // Fetch upcoming appointments
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const appointmentsResponse = await appointmentsApi.getAppointments({
          startDate: today.toISOString().split('T')[0],
          endDate: nextWeek.toISOString().split('T')[0],
        });
        const allAppointments = appointmentsResponse.data || [];

        // Search appointments
        const matchingAppointments = allAppointments
          .filter((apt: any) => {
            const clientName = (apt.client?.name || apt.clientName)?.toLowerCase() || '';
            const petName = (apt.pet?.name || apt.petName)?.toLowerCase() || '';
            const reason = (apt.reason || '')?.toLowerCase() || '';

            return (
              clientName.includes(normalizedQuery) ||
              petName.includes(normalizedQuery) ||
              reason.includes(normalizedQuery)
            );
          })
          .slice(0, 5)
          .map((apt: any) => {
            let matchType: 'client' | 'pet' | 'service' = 'client';
            const clientName = (apt.client?.name || apt.clientName)?.toLowerCase() || '';
            const petName = (apt.pet?.name || apt.petName)?.toLowerCase() || '';
            const reason = (apt.reason || '')?.toLowerCase() || '';

            if (reason.includes(normalizedQuery)) {
              matchType = 'service';
            } else if (petName.includes(normalizedQuery)) {
              matchType = 'pet';
            }

            return {
              id: apt.id,
              scheduledAt: apt.scheduled_at || apt.scheduledAt,
              clientName: apt.client?.name || apt.clientName,
              petName: apt.pet?.name || apt.petName,
              status: apt.status,
              reason: apt.reason,
              locationType: apt.location_type || apt.locationType,
              matchType,
            };
          });

        setResults({
          clients: matchingClients,
          pets: matchingPets.slice(0, 5),
          appointments: matchingAppointments,
        });
      } catch (error) {
        console.error('Search error:', error);
        setResults({
          clients: [],
          pets: [],
          appointments: [],
        });
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce 300ms
  }, []);

  const clearResults = useCallback(() => {
    setResults({
      clients: [],
      pets: [],
      appointments: [],
    });
  }, []);

  return {
    results,
    isLoading,
    search,
    clearResults,
  };
}
