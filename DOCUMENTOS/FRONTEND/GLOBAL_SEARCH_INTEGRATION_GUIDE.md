# 🔍 Guía de Integración - Global Search con Modales

## 📋 Resumen

El sistema de búsqueda global ahora funciona con **store compartido** que abre modales automáticamente en lugar de navegar a rutas específicas.

### Flujo:
```
Usuario busca "Alfredo" 
  → Click en resultado
  → openClientModal(idAlfredo) en store
  → Navega a /clinic/clients
  → Página detecta store y abre modal de Alfredo
```

---

## 🛠️ Implementación en Páginas

### Ejemplo: `/clinic/clients/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useSearchModalTrigger } from '@/hooks/useSearchModalTrigger';

export default function ClientsPage() {
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Hook detecta si viene de búsqueda global
  useSearchModalTrigger({
    onOpenClient: (clientId) => {
      setSelectedClientId(clientId);
      setShowClientModal(true);
    },
    onOpenPet: (petId, clientId) => {
      // Si quieres abrir modal de mascota
      setSelectedClientId(clientId);
      setShowClientModal(true); // O tu modal de mascotas
    },
  });

  return (
    <div>
      {/* Tu contenido... */}
      
      {/* Modal que se abre automáticamente desde búsqueda */}
      {showClientModal && (
        <ClientDetailModal
          clientId={selectedClientId}
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false);
            setSelectedClientId(null);
          }}
        />
      )}
    </div>
  );
}
```

---

## 📦 Archivos Creados/Modificados

### ✅ Creados:
- `src/store/useSearchModalStore.ts` - Store compartido
- `src/hooks/useSearchModalTrigger.ts` - Hook helper para páginas

### ✅ Modificados:
- `src/components/dashboard/GlobalSearchDropdown.tsx` - Usa store + router
- `src/components/dashboard/ModernTopBar.tsx` - Sin cambios (ya integrado)

---

## 🎯 API del Store

```typescript
// Abrir modal de cliente
openClientModal(clientId: string)

// Abrir modal de mascota
openPetModal(petId: string, clientId: string)

// Abrir modal de cita
openAppointmentModal(appointmentId: string)

// Cerrar modal y limpiar
closeModal()
```

---

## 📝 Checklist de Integración

Para cada página que quiera aprovechar la búsqueda global:

- [ ] Importar `useSearchModalTrigger`
- [ ] Llamar al hook con tus callbacks
- [ ] Pasar los `selectedId`/`isOpen` al modal correspondiente
- [ ] Testear que el modal se abra al buscar

---

## 🔗 Dónde Integrar

1. **`/clinic/clients/page.tsx`** ← Clientes
2. **`/clinic/grooming/page.tsx`** ← Citas
3. Otros que uses modales...

