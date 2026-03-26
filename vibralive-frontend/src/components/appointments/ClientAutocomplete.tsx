'use client';

import { useState, useCallback, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { Client } from '@/types';
import { clientsApi } from '@/lib/clients-api';
import { FormInput } from '@/components/FormFields';

interface ClientAutocompleteProps {
  value: string;
  onChange: (clientId: string) => void;
  onClientSelect?: (client: Client) => void;
  onCreateClientClick?: () => void;
  error?: string;
  disabled?: boolean;
}

export function ClientAutocomplete({
  value,
  onChange,
  onClientSelect,
  onCreateClientClick,
  error,
  disabled = false,
}: ClientAutocompleteProps) {
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');

  // Load initial options when opening
  useEffect(() => {
    if (isOpen && !searchInput) {
      loadClients('');
    }
  }, [isOpen]);

  const loadClients = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const response = await clientsApi.listClients(1, 15);
      let filtered = response.data || [];

      console.log('📥 [CLIENTS_API] Respuesta de listClients:', {
        totalClients: filtered.length,
        firstClient: filtered[0] ? {
          id: filtered[0].id,
          name: filtered[0].name,
          price_list_id: (filtered[0] as any).price_list_id,
          allKeys: Object.keys(filtered[0]).sort(),
        } : null,
        firstClientFull: filtered[0],
      });

      if (query.trim()) {
        const q = query.toLowerCase();
        // Clean phone query (remove non-digits)
        const cleanQuery = query.replace(/[^\d]/g, '');
        
        filtered = filtered.filter((c) => {
          // Search by name
          if (c.name.toLowerCase().includes(q)) return true;
          
          // Search by email
          if (c.email && c.email.toLowerCase().includes(q)) return true;
          
          // Search by phone (clean both for comparison)
          if (c.phone) {
            const cleanPhone = c.phone.replace(/[^\d]/g, '');
            if (cleanPhone.includes(cleanQuery) || cleanQuery.includes(cleanPhone)) return true;
          }
          
          // Search by address
          if (c.address && c.address.toLowerCase().includes(q)) return true;
          
          return false;
        });
      }

      setOptions(filtered);
    } catch (err) {
      console.error('Error loading clients:', err);
      setOptions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchInput(query);
      loadClients(query);
    },
    [loadClients]
  );

  const handleSelectClient = useCallback(
    (client: Client) => {
      console.log('🎯 [CLIENT AUTOCOMPLETE] Cliente seleccionado:',{
        id: client.id,
        name: client.name,
        price_list_id: (client as any).price_list_id,
        priceListId: (client as any).priceListId,
        allKeys: Object.keys(client).sort(),
        fullClient: client,
      });
      onChange(client.id);
      onClientSelect?.(client);
      setSelectedClientName(client.name);
      setSearchInput('');
      setIsOpen(false);
    },
    [onChange, onClientSelect]
  );

  // Reset selectedClientName when value changes (client selection cleared)
  useEffect(() => {
    if (!value) {
      setSelectedClientName('');
      setSearchInput('');
    } else if (value && selectedClientName === '') {
      // Load selected client name when value is set but name is empty
      const selected = options.find((c) => c.id === value);
      if (selected) {
        setSelectedClientName(selected.name);
      }
    }
  }, [value, options]);

  return (
    <div className="relative">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <FormInput
            type="text"
            placeholder="Buscar cliente por nombre, teléfono o dirección..."
            value={isOpen ? searchInput : selectedClientName}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            disabled={disabled}
            label="Cliente *"
            error={error}
            containerClassName="relative"
          />
        </div>

        {onCreateClientClick && (
          <button
            type="button"
            onClick={() => onCreateClientClick()}
            disabled={disabled}
            className="px-4 py-2 bg-primary-50 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-semibold text-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap h-10 hover:shadow-sm"
            title="Crear nuevo cliente"
          >
            <FiPlus size={18} />
            <span className="hidden sm:inline">Crear</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-sm text-gray-500">Buscando...</div>
          ) : options.length > 0 ? (
            options.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelectClient(client)}
                disabled={disabled}
                className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors disabled:opacity-50 border-b last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">
                  {client.name}
                </div>
                <div className="text-xs text-gray-600">
                  {client.email}
                  {client.phone && ` • ${client.phone}`}
                  {client.address && ` • ${client.address}`}
                </div>
              </button>
            ))
          ) : (
            <div className="p-3">
              {searchInput ? (
                <p className="text-sm text-gray-500 text-center py-2">
                  No se encontraron clientes
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Comienza a escribir para buscar
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
