/**
 * ClientDetailModal.tsx
 * Modal component for viewing and editing client details
 * Displays client information in tabbed interface
 */

import React, { useState, useEffect } from 'react';
import { MdClose, MdPerson, MdOpenInNew } from 'react-icons/md';
import { Client } from '@/types';
import { useClientsStore } from '@/store/useClientsStore';
import { clientsApi } from '@/lib/clients-api';
import toast from 'react-hot-toast';
import { ClientGeneralTab } from './ClientGeneralTab';
import { ClientPreferencesTab } from './ClientPreferencesTab';

// Helper function to format phone for WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.replace(/^\+/, '');
};

// Helper function to create WhatsApp link
const getWhatsAppLink = (phone: string): string => {
  const formatted = formatPhoneForWhatsApp(phone);
  if (!formatted) return '';
  return `https://wa.me/${formatted}`;
};

interface ClientDetailModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave?: (client: Client) => void;
}

type Tab = 'general' | 'preferences';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  client,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [localClient, setLocalClient] = useState<Client | null>(client);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalClient(client);
    setIsEditing(false);
  }, [client]);

  const handleSave = async () => {
    if (!client || !localClient) return;

    setIsSaving(true);
    try {
      // Create payload with only changed fields
      const payload: Partial<Client> = {};
      
      // Check each field for changes
      Object.keys(localClient).forEach((key) => {
        const clientValue = client[key as keyof Client];
        const localValue = localClient[key as keyof Client];
        
        // Only include if values differ
        if (clientValue !== localValue) {
          payload[key as keyof Client] = localValue;
        }
      });

      // Only send update if there are changes
      if (Object.keys(payload).length === 0) {
        toast.success('Sin cambios para guardar');
        setIsEditing(false);
        return;
      }

      console.log('📝 Guardando cambios de cliente:', { clientId: client.id, payload });

      // Call the API to update
      const updatedClient = await clientsApi.updateClient(client.id, payload as any);

      // Success
      toast.success('Cliente actualizado exitosamente');
      setLocalClient(updatedClient);
      
      // Call onSave callback if provided
      if (onSave) onSave(updatedClient);
      
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el cliente';
      toast.error(message);
      console.error('Error updating client:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !localClient) return null;

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'general', label: 'General', icon: '👤' },
    { id: 'preferences', label: 'Preferencias', icon: '⏰' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b border-blue-600 shadow-sm rounded-t-xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MdPerson className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">{localClient.name}</h2>
            </div>
            <a
              href={getWhatsAppLink(localClient.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-100 hover:text-white text-sm hover:underline flex items-center gap-1 w-fit"
            >
              {localClient.phone}
              <MdOpenInNew className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <ClientGeneralTab
              client={localClient}
              isEditing={isEditing}
              onClientChange={setLocalClient}
            />
          )}

          {activeTab === 'preferences' && (
            <ClientPreferencesTab
              client={localClient}
              isEditing={isEditing}
              onClientChange={setLocalClient}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cerrar
          </button>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Editar
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={() => {
                  setLocalClient(client);
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
