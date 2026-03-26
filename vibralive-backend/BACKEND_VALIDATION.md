# 📋 Validación Backend - VibraLive

## 🎯 Overview

Se implementó un **sistema de validación en el backend** que coincide exactamente con el frontend. Todos los errores se devuelven de manera consistente al cliente.

### Stack:
- **Class Validator** - Decoradores para validación
- **Class Transformer** - Transformación de tipos
- **Global Exception Filter** - Manejo centralizado de errores
- **NestJS Pipes** - Validación automática

---

## 🏗️ Estructura

```
vibralive-backend/src/
├── common/
│   └── filters/
│       ├── validation-exception.filter.ts  # Filtro global
│       └── index.ts
├── modules/
│   ├── auth/
│   │   └── dtos/
│   │       ├── auth.dto.ts              # ✅ ACTUALIZADO
│   │       └── (más)
│   ├── clients/
│   │   └── dtos/
│   │       ├── create-client.dto.ts     # ✅ NUEVO
│   │       ├── update-client.dto.ts     # ✅ NUEVO
│   │       └── index.ts
│   └── pets/
│       └── dtos/
│           ├── create-pet.dto.ts        # ✅ NUEVO
│           ├── update-pet.dto.ts        # ✅ NUEVO
│           └── index.ts
└── main.ts                              # ✅ ACTUALIZADO
```

---

## 📦 DTOs Implementados

### 1️⃣ **Auth DTOs** (Actualizado)

#### LoginDto
```typescript
{
  email: string          // Email válido requerido
  password: string       // Min 6 caracteres
}
```

#### RegisterDto
```typescript
{
  clinic_name: string    // 3-100 caracteres
  clinic_phone: string   // Formato E.164 (ej: +525512345678)
  owner_name: string     // 3-100 caracteres
  owner_email: string    // Email válido
  password: string       // 8+ chars, mayúscula, número, especial
  city?: string         // Opcional
}
```

### 2️⃣ **Client DTOs** (Nuevo)

#### CreateClientDto
```typescript
{
  name: string          // 3-100 caracteres
  email: string         // Email válido
  phone: string         // Teléfono válido
  city?: string         // Opcional
  address?: string      // Max 250 caracteres, opcional
}
```

#### UpdateClientDto
- Todos los campos son opcionales
- Mismas validaciones que CreateClientDto

### 3️⃣ **Pet DTOs** (Nuevo)

#### CreatePetDto
```typescript
{
  name: string                    // 2-50 caracteres
  animal_type_id: string          // UUID válido
  birth_date: string              // Fecha ISO
  gender: 'male' | 'female'      // Enum
  weight_kg: number               // 0.1 - 500 kg
  color_description?: string      // Max 100, opcional
  next_vaccine_date: string       // Fecha ISO
  next_deworming_date: string     // Fecha ISO
}
```

#### UpdatePetDto
- Todos los campos son opcionales
- Mismas validaciones que CreatePetDto

---

## 🔧 Cómo Usar

### En Controladores

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CreateClientDto } from './dtos';

@Controller('api/clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  async create(@Body() createClientDto: CreateClientDto) {
    // ValidationPipe automáticamente valida createClientDto
    // Si hay errores, el ValidationExceptionFilter los retorna
    return this.clientsService.create(createClientDto);
  }
}
```

**Eso es todo!** El `ValidationPipe` y `ValidationExceptionFilter` hacen el trabajo.

---

## 📤 Formato de Respuesta de Errores

### ✅ Créditero

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "123"
}
```

**Response (400):**
```json
{
  "message": "Validation failed",
  "statusCode": 400,
  "timestamp": "2026-02-24T10:30:45.123Z",
  "path": "/api/auth/login",
  "errors": {
    "email": [
      "Ingresa un email válido"
    ],
    "password": [
      "La contraseña debe tener al menos 6 caracteres"
    ]
  }
}
```

### ✅ Contraseña Débil

**Request:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "clinic_name": "Clínica Test",
  "clinic_phone": "+525512345678",
  "owner_name": "Juan Pérez",
  "owner_email": "juan@test.com",
  "password": "weak"
}
```

**Response (400):**
```json
{
  "message": "Validation failed",
  "statusCode": 400,
  "timestamp": "2026-02-24T10:30:45.123Z",
  "path": "/api/auth/register",
  "errors": {
    "password": [
      "La contraseña debe tener al menos 8 caracteres",
      "La contraseña debe contener al menos una mayúscula",
      "La contraseña debe contener al menos un número",
      "La contraseña debe contener al menos un carácter especial (!@#$%^&*)"
    ]
  }
}
```

### ✅ Éxito

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@vibralive.test",
  "password": "Admin@123456"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "owner@vibralive.test",
    "name": "Propietario",
    "role": "owner"
  }
}
```

---

## 🔄 Flujo de Validación

```
Frontend (Zod)          Backend (Class-Validator)
    ↓                           ↓
Input                    HTTP POST
    ↓                           ↓
Validación              ValidationPipe
    ↓                           ↓
Errores mostrados    ValidationExceptionFilter
    ↓                           ↓
Si OK, envía           DTO instanciado
    ↓                           ↓
JSON al backend        Service
```

---

## 🛡️ Características de Seguridad

### ✅ Whitelist
```typescript
whitelist: true
// Solo acepta propiedades definidas en DTO
// Rechaza campos extra
```

### ✅ Transform
```typescript
transform: true
// Convierte String "123" a Number 123 automáticamente
// Convierte strings de fechas a Date objects
```

### ✅ Mensajes en Español
Todos los mensajes están en español para mejor UX.

---

## 📚 Validadores Disponibles

### Strings
```typescript
@IsString()                      // Es string
@Length(min, max)               // Largo específico
@IsEmail()                       // Formato email
@Matches(regex)                  // Patrón regex
@IsOptional()                    // Campo opcional
```

### Números
```typescript
@IsNumber()                      // Es número
@Min(min)                        // Mínimo
@Max(max)                        // Máximo
```

### Fechas
```typescript
@IsDateString()                  // Formato ISO
```

### Enums
```typescript
@IsEnum(['male', 'female'])      // Valores permitidos
```

### UUIDs
```typescript
@IsUUID('4')                     // UUID v4 válido
```

---

## 🔗 Integración Frontend-Backend

El `ValidationExceptionFilter` devuelve errores en el mismo formato que `Zod` usa en frontend:

```typescript
// Frontend (Zod)
errors: {
  email: { message: 'Ingresa un email válido' },
  password: { message: 'Mínimo 6 caracteres' }
}

// Backend (Class-Validator)
errors: {
  email: ['Ingresa un email válido'],
  password: ['Mínimo 6 caracteres']
}
```

Este formato consistente permite reutilizar el código de manejo de errores en ambos lados.

---

## 📝 Ejemplo Completo: Crear Cliente

### Frontend
```typescript
const form = useFormValidation(
  { name: '', email: '', phone: '', city: '', address: '' },
  ClientSchema
);

const handleSubmit = async (e) => {
  e.preventDefault();
  const isValid = await form.validate();
  if (!isValid) return;
  
  // Envía al backend
  await api.post('/api/clients', form.values);
};
```

### Backend
```typescript
@Controller('api/clients')
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    // ValidationPipe valida createClientDto
    // Si hay errores → ValidationExceptionFilter los devuelve
    // Si es válido → service.create() se ejecuta
    return this.service.create(createClientDto);
  }
}
```

---

## ⚙️ Configuración en main.ts

```typescript
// ValidationPipe global
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Rechaza campos extra
    forbidNonWhitelisted: true,   // Error si hay campos extra
    transform: true,              // Transforma tipos
  }),
);

// Exception Filter global
app.useGlobalFilters(new ValidationExceptionFilter());
```

---

## 🚀 Próximas Mejoras

- [ ] Validadores async (email único, teléfono único)
- [ ] Custom validators
- [ ] Más tipos de errores (ConflictException, NotFoundException)
- [ ] Internationalization (i18n) para mensajes multiidioma
- [ ] Request logging mejorado

---

## 📋 Checklist de Validación

Frontend + Backend ahora valida:

✅ Login
- Email válido
- Contraseña min 6 caracteres

✅ Register
- Clinic name (3-100 caracteres)
- Clinic phone (E.164 format)
- Owner name (3-100 caracteres)
- Owner email (válido)
- Password (8+ chars, mayúscula, número, especial)

✅ Clients
- Name (3-100 caracteres)
- Email (válido)
- Phone (válido)
- City (opcional)
- Address (max 250 caracteres, opcional)

✅ Pets
- Name (2-50 caracteres)
- Animal type (UUID válido)
- Birth date (fecha válida)
- Gender (male/female)
- Weight (0.1-500 kg)
- Color description (max 100, opcional)
- Next vaccine date (fecha futura)
- Next deworming date (fecha futura)

---

¡Tu backend ahora valida exactamente igual que el frontend! 🎉
