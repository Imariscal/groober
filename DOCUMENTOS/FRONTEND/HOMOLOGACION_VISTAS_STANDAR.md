# 📋 Homologación de Vistas - Checklist Estándar

**Versión:** 1.0  
**Base de referencia:** Módulo de Mascotas (pets)  
**Última actualización:** Marzo 10, 2026

---

## 🎯 Visión General

Este documento define el estándar de diseño para todas las páginas de gestión en VibraLive. Cualquier página que siga este checklist será homologada automáticamente con el módulo de mascotas.

**Paleta de colores estándar:**
- `primary-600` a `primary-700` (Azul VibraLive: `#0284c7` - `#0369a1`)
- `warning-600` a `warning-700` (Naranja: para estados de alerta)
- `critical-600` (Rojo: para eliminaciones)
- `success-600` (Verde: para estados activos)

---

## 📁 ESTRUCTURA DE CARPETAS REQUERIDAS

```
src/app/(protected)/clinic/[MODULO]/
├── page.tsx (página principal)

src/components/
├── Create[Entidad]Modal.tsx
├── Edit[Entidad]Modal.tsx
├── Delete[Entidad]Confirmation.tsx
└── platform/
    ├── [Entidad]Card.tsx
    └── [Entidad]sTable.tsx
```

---

## ✅ CHECKLIST HOMOLOGACIÓN COMPLETA

### 📌 PASO 1: CREAR MODALES (Create/Edit/Delete)

#### 1.1 - CreateProductModal.tsx
**Ubicación:** `src/components/Create[Entidad]Modal.tsx`

**Estructura requerida:**
```tsx
'use client';

import React, { useState } from 'react';
import { MdClose, MdInventory2 } from 'react-icons/md';
import toast from 'react-hot-toast';

interface Create[Entidad]ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (item: [Entidad]) => void;
}

export function Create[Entidad]Modal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: Create[Entidad]ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    // ... todos los campos necesarios
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const newErrors: Record<string, string> = {};
    if (!formData.field1) newErrors.field1 = 'Campo requerido';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      // TODO: API call
      // const newItem = await api.create(formData);
      toast.success('[Entidad] creada exitosamente');
      onSuccess?.(newItem);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear [entidad]');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
          
          {/* HEADER - ESENCIAL */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdInventory2 className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Nueva [Entidad]</h2>
              </div>
              <p className="text-primary-100 text-sm">
                Agrega una nueva [entidad] a tu sistema
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* CONTENT con scroll */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECCIONES DE FORMULARIO */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Sección 1
                </h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                  {/* Campos aquí */}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Sección 2
                </h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                  {/* Campos aquí */}
                </div>
              </div>

            </form>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition disabled:opacity-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Validaciones obligatorias:**
- ✅ Campos requeridos marcados
- ✅ Mensajes de error específicos
- ✅ Estado de carga desactiva botones
- ✅ Toast de éxito/error
- ✅ Header con gradient `from-primary-600 via-primary-600 to-primary-700`

---

#### 1.2 - EditProductModal.tsx
**Ubicación:** `src/components/Edit[Entidad]Modal.tsx`

**Identico a CreateProductModal.tsx BUT:**
```tsx
interface Edit[Entidad]ModalProps {
  isOpen: boolean;
  product: [Entidad] | null;  // ← Recibe item seleccionado
  onClose: () => void;
  onSuccess?: (item: [Entidad]) => void;
}

// En el componente:
useEffect(() => {
  if (isOpen && product) {
    // Cargar datos del producto
    setFormData({
      field1: product.field1,
      field2: product.field2,
      // ...
    });
  }
}, [isOpen, product]);

// Header se diferencia:
<h2 className="text-2xl font-bold text-white">Editar [Entidad]</h2>
```

---

#### 1.3 - DeleteProductConfirmation.tsx
**Ubicación:** `src/components/Delete[Entidad]Confirmation.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import toast from 'react-hot-toast';

interface [Entidad] {
  id: string;
  name: string;
  // ... campos para mostrar en la confirmación
}

interface Delete[Entidad]ConfirmationProps {
  isOpen: boolean;
  item: [Entidad] | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function Delete[Entidad]Confirmation({
  isOpen,
  item,
  onClose,
  onSuccess,
}: Delete[Entidad]ConfirmationProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!item?.id) return;

    try {
      setLoading(true);
      // TODO: API call
      // await api.delete(item.id);
      toast.success('[Entidad] eliminada exitosamente');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar [entidad]');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-critical-100 rounded-lg">
              <MdWarning size={24} className="text-critical-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Eliminar [Entidad]
            </h2>
          </div>
          <button onClick={onClose} disabled={loading}>
            <MdClose size={24} className="text-gray-600" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4">
          <div className="bg-critical-50 border border-critical-200 rounded-lg p-4">
            <p className="text-gray-900 font-semibold">
              ¿Estás seguro de que deseas eliminar{' '}
              <span className="text-critical-600">{item.name}</span>?
            </p>
          </div>

          {/* Item Details */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Campo 1:</span>
              <span className="font-semibold text-gray-900">{item.field1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Campo 2:</span>
              <span className="font-semibold text-gray-900">{item.field2}</span>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-critical-600 text-white rounded-lg hover:bg-critical-700 disabled:opacity-50 transition font-semibold"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Esencial:**
- ✅ Header rojo con icono de warning
- ✅ Muestra detalles del item a eliminar
- ✅ Botones Cancelar/Eliminar
- ✅ Estado de carga

---

### 📌 PASO 2: CREAR COMPONENTES DE VISTA (Card y Table)

#### 2.1 - [Entidad]Card.tsx
**Ubicación:** `src/components/platform/[Entidad]Card.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { MdEdit, MdDelete, MdMoreVert, MdCheckCircle } from 'react-icons/md';

interface [Entidad] {
  id: string;
  name: string;
  // campos específicos del módulo
  [statusField]: boolean; // para activar/desactivar
  [lowStockField]?: boolean; // si aplica
}

interface [Entidad]CardProps {
  item: [Entidad];
  onEdit?: (item: [Entidad]) => void;
  onDelete?: (item: [Entidad]) => void;
  onToggleActive?: (item: [Entidad]) => void;
}

export function [Entidad]Card({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: [Entidad]CardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Lógica de estados
  const isInactive = !item.isActive;
  const isLowStock = item.stock <= item.minStock; // si aplica
  
  const headerBg = isInactive
    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
    : isLowStock
    ? 'bg-gradient-to-r from-warning-600 to-warning-700'
    : 'bg-gradient-to-r from-primary-600 to-primary-700';

  const statusLabel = isInactive ? 'Inactivo' : isLowStock ? 'Alerta' : 'Activo';
  const cardBg = isInactive ? 'bg-gray-50' : 'bg-white';

  return (
    <div className={`rounded-lg border overflow-hidden transition-all hover:shadow-md h-96 flex flex-col ${cardBg} ${isInactive ? 'border-gray-200' : 'border-primary-200'}`}>
      
      {/* HEADER */}
      <div className={`${headerBg} px-4 py-3 relative flex-shrink-0`}>
        {/* Status Badge */}
        <span className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold text-white ${
          isInactive ? 'bg-gray-500' : isLowStock ? 'bg-warning-500' : 'bg-success-500'
        }`}>
          {statusLabel}
        </span>

        <div className="flex items-start gap-3">
          {/* Avatar/Icon */}
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {item.name.slice(0, 2).toUpperCase()}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight truncate">
              {item.name}
            </h3>
            <p className="text-white/60 text-xs font-mono mt-0.5">{item.id.slice(0, 8)}</p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>

            {expandedId === item.id && (
              <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => {
                    onEdit?.(item);
                    setExpandedId(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-primary-50 text-primary-600 text-sm font-medium flex items-center gap-2 border-b border-gray-100"
                >
                  <MdEdit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onToggleActive?.(item);
                    setExpandedId(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-600 text-sm font-medium flex items-center gap-2 border-b border-gray-100"
                >
                  <MdCheckCircle className="w-4 h-4" />
                  {item.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => {
                    onDelete?.(item);
                    setExpandedId(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-critical-50 text-critical-600 text-sm font-medium flex items-center gap-2"
                >
                  <MdDelete className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT - No scroll, altura fija */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        {/* Secciones del contenido específico */}
        {/* Ejemplo: Stock info, pricing, etc */}
      </div>
    </div>
  );
}
```

**Checklist CardComponent:**
- ✅ h-96 (altura fija)
- ✅ Header con gradient primary
- ✅ Status badge con colores apropiados
- ✅ Menu flotante con 3 acciones: Editar, Activar/Desactivar, Eliminar
- ✅ Border color basado en estado (primary-200, gray-200)
- ✅ Sin scroll interno (overflow-hidden)

---

#### 2.2 - [Entidad]sTable.tsx
**Ubicación:** `src/components/platform/[Entidad]sTable.tsx`

```tsx
'use client';

import React from 'react';
import { MdEdit, MdDelete, MdCheckCircle } from 'react-icons/md';

interface [Entidad] {
  id: string;
  name: string;
  // campos para mostrar en tabla
}

interface [Entidad]sTableProps {
  items: [Entidad][];
  onEdit?: (item: [Entidad]) => void;
  onDelete?: (item: [Entidad]) => void;
  onToggleActive?: (item: [Entidad]) => void;
}

export function [Entidad]sTable({ 
  items, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: [Entidad]sTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        
        {/* HEADER */}
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Nombre
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Campo 2
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Estado
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-20">
              Acciones
            </th>
          </tr>
        </thead>

        {/* ROWS */}
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const isInactive = !item.isActive;
            
            return (
              <tr
                key={item.id}
                className={`transition group ${
                  isInactive
                    ? 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-400'
                    : 'hover:bg-primary-50/30 border-l-4 border-l-primary-400'
                }`}
              >
                {/* Columna 1 - Nombre */}
                <td className="px-4 py-2.5">
                  <div>
                    <span className="font-semibold text-gray-900">{item.name}</span>
                  </div>
                </td>

                {/* Columna 2 - Campo adicional */}
                <td className="px-4 py-2.5">
                  <span className="text-gray-600">{item.field2}</span>
                </td>

                {/* Columna 3 - Estado */}
                <td className="px-4 py-2.5 text-center">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    isInactive
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-success-100 text-success-700'
                  }`}>
                    {item.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                {/* Columna 4 - Acciones */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEdit?.(item)}
                      className="p-2 text-primary-600 hover:bg-primary-100 rounded transition"
                      title="Editar"
                    >
                      <MdEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleActive?.(item)}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded transition"
                      title={item.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <MdCheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(item)}
                      className="p-2 text-critical-600 hover:bg-critical-100 rounded transition"
                      title="Eliminar"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Checklist TableComponent:**
- ✅ Overflow-x para horizontales grandes
- ✅ Row highlight al hover (bg-primary-50/30)
- ✅ Border left color basado en estado
- ✅ Botones de acción aparecen en hover (opacity-0 group-hover:opacity-100)
- ✅ 3 acciones: Editar, Activar/Desactivar, Eliminar
- ✅ Status badge inline en las filas

---

### 📌 PASO 3: IMPLEMENTAR PAGE.TSX

**Ubicación:** `src/app/(protected)/clinic/[MODULO]/page.tsx`

```tsx
'use client';

import React, { useState, useMemo } from 'react';
import { MdAdd, MdInventory2 } from 'react-icons/md';
import { FiFilter, FiSearch, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { Create[Entidad]Modal } from '@/components/Create[Entidad]Modal';
import { Edit[Entidad]Modal } from '@/components/Edit[Entidad]Modal';
import { Delete[Entidad]Confirmation } from '@/components/Delete[Entidad]Confirmation';
import { [Entidad]Card } from '@/components/platform/[Entidad]Card';
import { [Entidad]sTable } from '@/components/platform/[Entidad]sTable';
import toast from 'react-hot-toast';

interface [Entidad] {
  id: string;
  name: string;
  // campos específicos
  isActive: boolean;
}

type ViewMode = 'cards' | 'table';

export default function [Modulo]PageV2() {
  // ==================== STATE ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<[Entidad] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<[Entidad] | null>(null);

  // Mock data
  const [[entidades], set[Entidades]] = useState<[Entidad][]>([
    // TODO: Reemplazar con datos reales de API
  ]);

  // ==================== HANDLERS ====================
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('[Modulo] actualizado');
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = (newItem: [Entidad]) => {
    set[Entidades]([...entidades, newItem]);
    toast.success('[Entidad] creada exitosamente');
  };

  const handleEdit = (updatedItem: [Entidad]) => {
    set[Entidades](entidades.map(i => i.id === updatedItem.id ? updatedItem : i));
    toast.success('[Entidad] actualizada exitosamente');
  };

  const handleDelete = (item: [Entidad]) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      set[Entidades](entidades.filter(i => i.id !== deletingItem.id));
      setDeletingItem(null);
      toast.success('[Entidad] eliminada');
    }
  };

  const handleToggleActive = (item: [Entidad]) => {
    set[Entidades](entidades.map(i =>
      i.id === item.id ? { ...i, isActive: !i.isActive } : i
    ));
    toast.success(`[Entidad] ${!item.isActive ? 'activada' : 'desactivada'}`);
  };

  // ==================== FILTERING ====================
  const filteredItems = useMemo(() => {
    let filtered = entidades;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(term)
        // ... más filtros específicos
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(i => i.category === filterCategory);
    }

    return filtered;
  }, [entidades, searchTerm, filterCategory]);

  // ==================== STATISTICS ====================
  const stats = useMemo(() => {
    return {
      total: entidades.length,
      active: entidades.filter(i => i.isActive).length,
      inactive: entidades.filter(i => !i.isActive).length,
      // ... más estadísticas específicas
    };
  }, [entidades]);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      
      {/* MODALES */}
      <Create[Entidad]Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreate}
      />
      <Edit[Entidad]Modal
        isOpen={isEditModalOpen}
        item={editingItem}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleEdit}
      />
      <Delete[Entidad]Confirmation
        isOpen={!!deletingItem}
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onSuccess={handleConfirmDelete}
      />

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdInventory2 className="text-primary-600 text-3xl" />
              [Módulo]
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestión de [entidades]
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <MdAdd className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva [Entidad]</span>
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-lg text-sm">
            <span className="text-success-600">✓</span>
            <span className="text-success-700">Activos:</span>
            <span className="font-semibold text-success-700">{stats.active}</span>
          </div>
          {stats.inactive > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-600">✕</span>
              <span className="text-gray-700">Inactivos:</span>
              <span className="font-semibold text-gray-700">{stats.inactive}</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT PANEL - FILTERS */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Categoría</span>
              </div>
              <div className="space-y-2">
                {['all', 'category1', 'category2'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterCategory === cat
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todas' : cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL - CONTENT */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* VIEW TOGGLE */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredItems.length} [entidades] encontradas
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'cards'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tarjetas"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                      <path d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'table'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tabla"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay [entidades] que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredItems.map((item) => (
                      <[Entidad]Card
                        key={item.id}
                        item={item}
                        onEdit={(p) => {
                          setEditingItem(p);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                      />
                    ))}
                  </div>
                ) : (
                  <[Entidad]sTable
                    items={filteredItems}
                    onEdit={(p) => {
                      setEditingItem(p);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
```

**Checklist Page.tsx:**
- ✅ Estado: search, filters, viewMode, modals, items
- ✅ Handlers: refresh, create, edit, delete, toggle, confirm
- ✅ Filtering con useMemo
- ✅ Statistics con useMemo
- ✅ Header con icon primary, title, refresh y nuevo botón
- ✅ Stats bar con colores específicos
- ✅ Left panel con búsqueda y filtros
- ✅ Right panel con toggle de vista
- ✅ Grid cards: 1 col mobile, 2 col tablet, 3 col desktop
- ✅ Table view con acciones en hover
- ✅ Integración de los 3 modales

---

## 🎨 PALETA DE COLORES ESTÁNDAR

```
Primary (Azul VibraLive):
- from-primary-600 via-primary-600 to-primary-700
- hover:bg-primary-700
- bg-primary-100 (background light)
- text-primary-600 (texto)
- border-primary-200 (bordes)

Warning (Naranja - Low Stock/Alerta):
- from-warning-600 to-warning-700
- bg-warning-100
- text-warning-600
- use case: stock bajo, estados de alerta

Critical (Rojo - Eliminar):
- bg-critical-600 hover:bg-critical-700
- bg-critical-100
- text-critical-600
- use case: botones de eliminar, confirmaciones peligrosas

Success (Verde - Activo):
- bg-success-100
- text-success-600 / text-success-700
- use case: status activo, estados positivos

Gray (Desactivado):
- from-gray-600 to-gray-700
- bg-gray-50
- border-gray-200
- use case: items inactivos
```

---

## 📋 VALIDATION CHECKLIST

```
ANTES DE APLICAR HOMOLOGACIÓN A UNA NUEVA PÁGINA:

□ MODALES
  □ CreateModal header: from-primary-600 via-primary-600 to-primary-700
  □ EditModal header: mismo
  □ DeleteConfirmation header: rojo con warning icon
  □ Todos tienen MdClose button
  □ Todos tienen footer con Cancelar/Guardar o Cancelar/Eliminar
  □ Form tiene validación y error messages
  □ Toast en éxito/error

□ COMPONENTES VISTA
  □ [Entidad]Card h-96 fijo
  □ Header con gradient correcto
  □ Status badge con colores apropiados
  □ Menu button (MdMoreVert) con 3 opciones
  □ Border color basado en estado (primary-200 o gray-200)
  □ No hace scroll internamente
  
  □ [Entidad]sTable 
  □ Rows con hover color primario
  □ Border left color basado en estado
  □ Botones en hover (opacity-0 group-hover:opacity-100)
  □ 3 acciones: Editar, Activar/Desactivar, Eliminar

□ PAGE.TSX
  □ Header con icon primary, title, refresh, nuevo button
  □ Stats bar con 3-4 métricas
  □ Left panel: search + filters
  □ Right panel: toggle view + content
  □ Cards grid: 1 md:2 xl:3
  □ Table con acciones en hover
  □ Empty state message
  □ Todos los handlers implementados
  □ Estado de loading en botones/inputs
  □ Toast notifications

□ IMPORTS
  □ react-icons: MdAdd, MdEdit, MdDelete, MdMoreVert, MdClose, MdWarning, MdCheckCircle
  □ react-icons: FiFilter, FiSearch, FiAlertCircle, FiRefreshCw
  □ react-hot-toast para notifications

□ COLORES
  □ Primary usado en headers, botones, borders activos
  □ Warning usado para bajos stocks/alertas
  □ Critical usado para delete/peligrosos
  □ Success usado para estados activos
  □ Gray usado para inactivos
```

---

## 🚀 FLUJO DE APLICACIÓN

Cuando se le pida: **"Aplica homologación a [página]"**

1. **Crear 3 modales:**
   - `Create[Entidad]Modal.tsx`
   - `Edit[Entidad]Modal.tsx`
   - `Delete[Entidad]Confirmation.tsx`

2. **Crear 2 componentes de vista:**
   - `[Entidad]Card.tsx`
   - `[Entidad]sTable.tsx`

3. **Reescribir page.tsx:**
   - Importar todos los componentes nuevos
   - Implementar estado (search, filters, view modes, modals)
   - Implementar handlers (CRUD + toggle)
   - Crear header con stats
   - Crear left panel con filters
   - Crear right panel con content
   - Integrar cards y table views

4. **Verificar checklist** antes de dar por terminado

---

## 📞 NOTAS IMPORTANTES

- **Colores NUNCA blue/orange:** Siempre usar `primary`, `warning`, `critical`, `success`
- **Header modales SIEMPRE:** `from-primary-600 via-primary-600 to-primary-700`
- **Card SIEMPRE h-96:** Altura fija, sin scroll interno
- **Menu SIEMPRE 3 botones:** Editar, Activar/Desactivar, Eliminar
- **Stats SIEMPRE en header:** Con colores semánticos
- **Grid SIEMPRE responsive:** 1 mobile, 2 tablet, 3 desktop

---

## 📁 ARCHIVOS BASE (COPIAR COMO TEMPLATE)

Usar estos archivos como base cuando se cree una nueva homologación:

1. `src/components/CreateProductModal.tsx` (copiar para Create[Entidad]Modal)
2. `src/components/EditProductModal.tsx` (copiar para Edit[Entidad]Modal)
3. `src/components/DeleteProductConfirmation.tsx` (copiar para Delete[Entidad]Confirmation)
4. `src/components/platform/ProductCard.tsx` (copiar para [Entidad]Card)
5. `src/components/platform/ProductsTable.tsx` (copiar para [Entidad]sTable)
6. `src/app/(protected)/clinic/inventory/page.tsx` (copiar para [modulo]/page.tsx)

Luego solo reemplazar:
- Nombres de componentes
- Nombres de campos específicos
- Lógica de filtrado
- Estadísticas

**El 90% del código es reutilizable.**

---

## ✨ EJEMPLO DE APLICACIÓN

Si te digo: **"Applica homologación a preventive-care"**

Tú debes:

1. Crear:
   - `CreatePreventiveCareModal.tsx`
   - `EditPreventiveCareModal.tsx`
   - `DeletePreventiveCareConfirmation.tsx`
   - `PreventiveCareCard.tsx`
   - `PreventiveCaresTable.tsx`

2. Actualizar:
   - `preventive-care/page.tsx`

3. Usar esta estructura exactamente, solo adaptando nombres y campos específicos de preventive-care

Sin necesidad de pedir confirmación de detalles porque todo está aquí especificado.

