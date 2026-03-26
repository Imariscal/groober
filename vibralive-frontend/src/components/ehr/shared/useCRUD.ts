'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CRUDActions } from './types';

export function useCRUD<T extends { id: string }>(actions: CRUDActions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [error, setError] = useState<string>('');

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      await actions.onRefresh();
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [actions]);

  const handleCreate = useCallback(async (formData: any) => {
    try {
      setLoading(true);
      setError('');
      await actions.onCreate(formData);
      toast.success('Registro creado exitosamente');
      await handleRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      const message = err?.message || 'Error al crear registro';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [actions, handleRefresh]);

  const handleUpdate = useCallback(async (formData: any) => {
    if (!selectedItem) return;

    try {
      setLoading(true);
      setError('');
      await actions.onUpdate(selectedItem.id, formData);
      toast.success('Registro actualizado exitosamente');
      await handleRefresh();
      setIsModalOpen(false);
      setSelectedItem(null);
      setIsEditing(false);
    } catch (err: any) {
      const message = err?.message || 'Error al actualizar registro';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [actions, selectedItem, handleRefresh]);

  const handleDelete = useCallback(async (item: T) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este registro?'
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await actions.onDelete(item.id);
      toast.success('Registro eliminado exitosamente');
      await handleRefresh();
    } catch (err: any) {
      const message = err?.message || 'Error al eliminar registro';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [actions, handleRefresh]);

  const handleEdit = useCallback((item: T) => {
    setSelectedItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
    setError('');
  }, []);

  const handleNew = useCallback(() => {
    setSelectedItem(null);
    setIsEditing(false);
    setIsModalOpen(true);
    setError('');
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setIsEditing(false);
    setError('');
  }, []);

  return {
    data,
    setData,
    loading,
    isModalOpen,
    isEditing,
    selectedItem,
    error,
    handleRefresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleEdit,
    handleNew,
    handleCloseModal,
    handleSubmit: isEditing ? handleUpdate : handleCreate,
  };
}
