# 📋 Guía de Validación de Datos - Frontend

## 🎯 Overview

Se implementó un **sistema completo de validación de datos** usando **Zod** como schema validator. El sistema es:

- ✅ **Type-safe** - TypeScript completo
- ✅ **Reutilizable** - Funciona en cualquier formulario
- ✅ **Reactivo** - Validación en tiempo real
- ✅ **Accesible** - Errores claros y bien posicionados
- ✅ **Flexible** - Fácil de extender

---

## 📦 Archivos Creados

```
vibralive-frontend/src/
├── lib/
│   └── validations.ts          # Schemas de Zod para todos los formularios
├── hooks/
│   └── useFormValidation.ts    # Hook reutilizable para validación
└── components/
    ├── FormFields.tsx          # Componentes de inputs con validación
    ├── LoginForm.tsx           # Login con validación ✅ ACTUALIZADO
    ├── RegisterForm.tsx        # Registro con validación
    ├── ClientForm.tsx          # Formulario de clientes
    └── PetForm.tsx             # Formulario de mascotas
```

---

## 🔧 Cómo Funciona

### 1️⃣ **Definir Schemas (validations.ts)**

```typescript
// Importa de Zod
import { z } from 'zod';

// Define un schema
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// Genera tipos TypeScript automáticamente
export type LoginFormData = z.infer<typeof LoginSchema>;
```

**Validaciones disponibles:**
- `.string().min().max()` - Longitud de texto
- `.email()` - Validar email
- `.regex()` - Patrón personalizado
- `.number().positive()` - Números
- `.date()` - Fechas
- `.enum()` - Opciones limitadas
- `.refine()` - Validación custom

---

### 2️⃣ **Usar el Hook (useFormValidation)**

```typescript
import { useFormValidation } from '@/hooks/useFormValidation';
import { LoginSchema, LoginFormData } from '@/lib/validations';

export function LoginForm() {
  // Inicializa el hook
  const form = useFormValidation<LoginFormData>(
    { email: '', password: '' },  // Valores iniciales
    LoginSchema                     // Schema de validación
  );

  // Accede a los valores y errores
  console.log(form.values);        // { email: '...', password: '...' }
  console.log(form.errors);        // { email?: { message: '...' } }
  console.log(form.touched);       // Fields visitados por el usuario
  
  // Métodos del hook
  form.setFieldValue('email', 'test@test.com');
  form.setFieldTouched('email', true);
  await form.validate();           // Valida todo
  form.resetForm();                // Reset a valores iniciales
  
  // Helpers para inputs
  const emailProps = form.getFieldProps('email');
  // Retorna: value, onChange, onBlur
}
```

---

### 3️⃣ **Componentes de Formulario (FormFields.tsx)**

#### FormInput

```typescript
<FormInput
  id="email"
  type="email"
  label="Email"
  placeholder="correo@ejemplo.com"
  value={form.values.email}
  onChange={(e) => form.setFieldValue('email', e.target.value)}
  onBlur={() => form.setFieldTouched('email', true)}
  error={form.touched.email ? form.errors.email?.message : undefined}
  required
/>

// O más simple con getFieldProps
<FormInput
  id="email"
  type="email"
  label="Email"
  {...form.getFieldProps('email')}
  error={form.touched.email ? form.errors.email?.message : undefined}
  required
/>
```

#### FormSelect

```typescript
<FormSelect
  id="animal_type_id"
  label="Tipo de Animal"
  options={[
    { value: '1', label: 'Perro' },
    { value: '2', label: 'Gato' },
  ]}
  {...form.getFieldProps('animal_type_id')}
  error={form.touched.animal_type_id ? form.errors.animal_type_id?.message : undefined}
  required
/>
```

#### FormTextArea

```typescript
<FormTextArea
  id="description"
  label="Descripción"
  {...form.getFieldProps('description')}
  error={form.touched.description ? form.errors.description?.message : undefined}
/>
```

---

### 4️⃣ **Ejemplo Completo: LoginForm**

```typescript
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { LoginSchema, LoginFormData } from '@/lib/validations';
import { FormInput, InfoAlert } from './FormFields';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function LoginForm() {
  const { login, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Inicializa el hook
  const form = useFormValidation<LoginFormData>(
    { email: '', password: '' },
    LoginSchema
  );

  // 2. Handler del submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Valida todo antes de enviar
    const isValid = await form.validate();
    if (!isValid) {
      toast.error('Por favor, completa todos los campos correctamente');
      return;
    }

    try {
      await login(form.values.email, form.values.password);
      toast.success('¡Login exitoso!');
      form.resetForm();
    } catch (err) {
      setFormError(authError || 'Error en el login');
      toast.error(authError || 'Error en el login');
    }
  };

  // 3. Renderiza el form con validación
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(formError || authError) && (
        <InfoAlert onClose={() => setFormError(null)}>
          {formError || authError}
        </InfoAlert>
      )}

      <FormInput
        id="email"
        type="email"
        label="Email"
        placeholder="correo@ejemplo.com"
        {...form.getFieldProps('email')}
        error={form.touched.email ? form.errors.email?.message : undefined}
        required
      />

      <FormInput
        id="password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        {...form.getFieldProps('password')}
        error={form.touched.password ? form.errors.password?.message : undefined}
        required
      />

      <button
        type="submit"
        disabled={isLoading || form.isValidating}
      >
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

---

## ✨ Características Principales

### 🔴 Validación en Tiempo Real

```typescript
// Se valida mientras escribes
const handleChange = (e) => {
  form.setFieldValue('email', e.target.value);
  // Los errores se actualizan automáticamente
};
```

### 🎯 Errores por Campo

```typescript
// Solo muestra errores si el campo fue tocado (touched)
{form.touched.email && form.errors.email && (
  <FormFieldError message={form.errors.email.message} />
)}
```

### 🔐 Validación Custom

```typescript
// En validations.ts - Validar que confirm_password = password
const RegisterSchema = z.object({
  password: z.string().min(8),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});
```

### 📱 Responsive

Todos los componentes son responsive con Tailwind:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <FormInput ... />
  <FormInput ... />
</div>
```

---

## 🚀 Cómo Usar en un Nuevo Formulario

### Paso 1: Define el Schema

```typescript
// En lib/validations.ts
export const MyFormSchema = z.object({
  field1: z.string().min(1, 'Requerido'),
  field2: z.number().positive('Debe ser positivo'),
});

export type MyFormData = z.infer<typeof MyFormSchema>;
```

### Paso 2: Crea el Componente

```typescript
// En components/MyForm.tsx
'use client';

import { useFormValidation } from '@/hooks/useFormValidation';
import { MyFormSchema, MyFormData } from '@/lib/validations';
import { FormInput } from './FormFields';

export function MyForm() {
  const form = useFormValidation<MyFormData>(
    { field1: '', field2: 0 },
    MyFormSchema
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.validate();
    if (isValid) {
      console.log(form.values); // Envía al backend
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        id="field1"
        label="Field 1"
        {...form.getFieldProps('field1')}
        error={form.touched.field1 ? form.errors.field1?.message : undefined}
      />
      <FormInput
        id="field2"
        type="number"
        label="Field 2"
        {...form.getFieldProps('field2')}
        error={form.touched.field2 ? form.errors.field2?.message : undefined}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

---

## 📋 Schemas Disponibles

### 1. LoginSchema
```typescript
email: string (email válido)
password: string (min 6 caracteres)
```

### 2. RegisterSchema
```typescript
clinic_name: string (3-100 caracteres)
clinic_phone: string (formato E.164)
owner_name: string (min 3 caracteres)
owner_email: string (email válido)
password: string (8+ chars, mayúscula, número, especial)
confirm_password: string (coincide con password)
```

### 3. ClientSchema
```typescript
name: string (3-100 caracteres)
email: string (email válido)
phone: string (formato válido)
city: string (opcional)
address: string (max 250 caracteres, opcional)
```

### 4. PetSchema
```typescript
name: string (2-50 caracteres)
animal_type_id: string (UUID válido)
birth_date: string (fecha en pasado)
gender: enum ('male' | 'female')
weight_kg: number (> 0, < 500)
color_description: string (max 100, opcional)
next_vaccine_date: string (fecha en futuro)
next_deworming_date: string (fecha en futuro)
```

---

## 🎨 Styling

Todos los componentes usan **Tailwind CSS** y soportan estados:

- ✅ Focus
- ❌ Error (rojo)
- ⏳ Loading (deshabilitado)
- 📱 Responsive (mobile-first)

---

## ⚡ Tips

1. **Siempre valida antes de enviar:**
   ```typescript
   const isValid = await form.validate();
   if (!isValid) return; // No envíes si hay errores
   ```

2. **Usa `getFieldProps()` para simplificar:**
   ```typescript
   {...form.getFieldProps('email')}
   // Equivale a:
   // value={form.values.email}
   // onChange={...}
   // onBlur={...}
   ```

3. **Muestra errores solo después de interacción:**
   ```typescript
   error={form.touched.email ? form.errors.email?.message : undefined}
   ```

4. **Limpia el form después de éxito:**
   ```typescript
   await api.post('/create', form.values);
   form.resetForm(); // ← No olvides esto
   ```

---

## 🔗 Dependencias

- **zod** (^3.22.4) - Schema validation
- **react-icons** - Iconos
- **react-hot-toast** - Notificaciones
- **clsx** - Clase condicionales
- **tailwindcss** - Styling

---

## ✅ Próximas Integraciones

- [ ] Validación en backend (espejo de schemas)
- [ ] Error handling mejorado
- [ ] Async validators (verificar email único, etc)
- [ ] Multi-step forms
- [ ] Autocomplete en campos

---

¡Listo! Ahora tienes un sistema de validación robusto y profesional. 🚀
