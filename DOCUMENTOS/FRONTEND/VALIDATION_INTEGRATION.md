# 🔐 Validación End-to-End: Frontend + Backend

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO INGRESA DATOS                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                      ┌──────▼──────┐
                      │   FRONTEND  │
                      │  (React/Zod)│
                      └──────┬──────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐      ┌───────▼────────┐    ┌────▼────┐
    │Validar  │      │ Mostrar Errores│    │Sin Errores
    │en tiempo│      │en el campo     │    │
    │real     │      │                │    │
    └─────────┘      └───────┬────────┘    └────┬────┘
                             │                   │
                             └───────────┬───────┘
                                        │
                         ┌──────────────▼─────────────┐
                         │  BOTÓN SUBMIT HABILITADO?  │
                         └──────────────┬─────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            ┌───────▼──────┐      ┌─────▼──────┐      ┌────▼─────┐
            │Hay Errores   │      │Validar    │      │
            │Toast Error   │      │TODO antes  │      │
            │Return        │      │de enviar   │      │
            └───────────────┘      └─────┬──────┘      │
                                         │             │
                                   ┌─────▼────────────▼┐
                                   │  ENVIAR AL BACK   │
                                   │  POST /api/auth   │
                                   └────────┬──────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │      BACKEND (NestJS)      │
                              │   (Class-Validator)        │
                              └─────────────┬──────────────┘
                                            │
                        ┌───────────────────┼────────────────────┐
                        │                   │                    │
                    ┌───▼──┐        ┌───────▼────────┐     ┌─────▼────┐
                    │DTO   │        │ ValidationPipe │     │
                    │vacio?│        │ Valida cada    │     │
                    │      │        │ decorador      │     │
                    └───┬──┘        └───────┬────────┘     │
                        │                   │              │
                        │        ┌──────────▼────────────┐ │
                        │        │ ¿Hay Errores?        │ │
                        │        └──────────┬───────────┘ │
                        │                   │             │
                   ┌────▼───────┐      ┌────▼──────┐      │
                   │ValidError  │      │Todo OK    │      │
                   │Caught      │      │           │      │
                   └────┬───────┘      └────┬──────┘      │
                        │                   │             │
            ┌───────────▼───────────┐       │             │
            │Exception Filter       │       │             │
            │ - Formatea errores    │       │             │
            │ - JSON response       │       │             │
            └───────────┬───────────┘       │             │
                        │                   │             │
         ┌──────────────▼──────────────┐    │             │
         │  Response 400               │    │             │
         │  {                          │    │             │
         │    errors: {                │    │             │
         │      email: [...]           │    │             │
         │    }                        │    │             │
         │  }                          │    │             │
         └──────────────┬──────────────┘    │             │
                        │                   │             │
                        │        ┌──────────▼──────────────────┐
                        │        │  Service Process Request    │
                        │        │  - Hash Password            │
                        │        │  - Save to DB               │
                        │        │  - Generate JWT             │
                        │        └──────────┬───────────────────┘
                        │                   │
                        │        ┌──────────▼──────────────────┐
                        │        │  Response 200/201           │
                        │        │  {                          │
                        │        │    access_token: "...",    │
                        │        │    user: {...}             │
                        │        │  }                         │
                        │        └──────────┬───────────────────┘
                        │                   │
         ┌──────────────▼──────────────┐    │
         │  FRONTEND: Procesa Response │    │
         │  - Si 400: Muestra Errores  │    │
         │  - Si 200: Guarda Token     │    │
         │  - Si 200: Redirige         │    │
         └──────────────┬──────────────┘    │
                        │                   │
                        └───────────┬───────┘
                                    │
                          ┌─────────▼─────────┐
                          │  FIN DEL FLUJO    │
                          └───────────────────┘
```

---

## 🔍 Ejemplo Real: Login

### **Paso 1: Usuario Escribe Datos**

```
Email: "invalid"
Password: "123"
```

### **Paso 2: Validación Frontend (Zod)**

```typescript
const LoginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'Min 6 caracteres'),
});

// Validación
LoginSchema.parseAsync({ email: 'invalid', password: '123' });

// Resultado
❌ Errores:
- email: "Ingresa un email válido"
- password: "Min 6 caracteres"
```

### **Paso 3: Mostrar en UI**

```tsx
<FormInput
  {...form.getFieldProps('email')}
  error={form.touched.email ? form.errors.email?.message : undefined}
/>
// Muestra: "Ingresa un email válido"
```

### **Paso 4: Usuario Corrige y Clickea Submit**

```
Email: "owner@vibralive.test"
Password: "Admin@123456"
```

### **Paso 5: Frontend Valida Nuevamente**

```typescript
const isValid = await form.validate();
// ✅ true - sin errores
```

### **Paso 6: Envía al Backend**

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@vibralive.test",
  "password": "Admin@123456"
}
```

### **Paso 7: Backend - ValidationPipe**

```typescript
class LoginDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @Length(6, 255)
  password: string;
}

// Valida automáticamente
// ✅ Email es válido
// ✅ Password tiene 12 caracteres
```

### **Paso 8: Backend - Service**

```typescript
async login(loginDto: LoginDto) {
  // DTO ya validado
  const user = await this.findUserByEmail(loginDto.email);
  const isPasswordValid = await bcrypt.compare(
    loginDto.password,
    user.hashed_password
  );
  // ... más lógica
  return { access_token: '...', user: {...} };
}
```

### **Paso 9: Response Success**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "owner@vibralive.test",
    "name": "Propietario",
    "role": "owner"
  }
}
```

### **Paso 10: Frontend - Maneja Éxito**

```typescript
const response = await login(form.values.email, form.values.password);
// ✅ Token guardado en localStorage
// ✅ User guardado en Zustand store
// ✅ Redirige a /dashboard
```

---

## ❌ Ejemplo con Error

### **Caso: Teléfono Inválido en Register**

**Usuario ingresa:**
```
Clinic Phone: "123456"
```

**Paso 1: Frontend Valida**
```typescript
const RegisterSchema = z.object({
  clinic_phone: z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    'Ingresa un teléfono válido (E.164)'
  )
});

// ❌ Error: "Ingresa un teléfono válido (E.164)"
```

**UI muestra el error:**
```
┌─────────────────────────────────┐
│ Teléfono de la Clínica          │
│ [123456..................]      │
│ ⚠️ Ingresa un teléfono válido   │
└─────────────────────────────────┘
```

**Usuario corrige:**
```
Clinic Phone: "+525512345678"
```

**Frontend valida OK ✅**

**Envía al backend:**
```
POST /api/auth/register
{
  "clinic_phone": "+525512345678"
}
```

**Backend - ValidationPipe:**
```typescript
@Matches(/^\+?[1-9]\d{1,14}$/)
clinic_phone: string;

// ✅ "+525512345678" es válido
```

---

## 🔐 Casos de Seguridad

### **1. Contraseña Débil (Frontend)**

```
Password: "Admin123"  (sin especial)
```

**Frontend rechaza:**
```
❌ La contraseña debe contener al menos 
   un carácter especial (!@#$%^&*)
```

**Usuario no puede clickear Submit**

### **2. Contraseña Débil (Backend)**

Si alguien intenta bypassear:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"password": "Admin123"}'
```

**Backend valida:**
```typescript
@Matches(/[!@#$%^&*]/)
password: string;
```

**Response:**
```json
{
  "statusCode": 400,
  "errors": {
    "password": [
      "La contraseña debe contener al menos 
       un carácter especial (!@#$%^&*)"
    ]
  }
}
```

### **3. Inyección de Campos Extra**

**Request.**
```json
{
  "email": "test@test.com",
  "password": "Admin@123456",
  "admin": true,
  "role": "owner"
}
```

**Backend (whitelist: true):**
```typescript
// Solo acepta email y password
// Ignora admin y role
// forbidNonWhitelisted: true → Error 400
{
  "statusCode": 400,
  "errors": {
    "admin": ["property admin should not exist"],
    "role": ["property role should not exist"]
  }
}
```

---

## 📦 Estructura de Errores Consistente

### **Frontend (Zod)**
```typescript
errors: {
  email: { message: "Email inválido" },
  password: { message: "Min 6 caracteres" }
}
```

### **Backend (Class-Validator)**
```json
{
  "errors": {
    "email": ["Email inválido"],
    "password": ["Min 6 caracteres"]
  }
}
```

### **Normalización en Frontend**
```typescript
// El frontend puede procesar ambos formatos
const getErrorMessage = (field: string, errors: any) => {
  const error = errors[field];
  
  if (Array.isArray(error)) {
    return error[0]; // Backend
  } else if (error?.message) {
    return error.message; // Zod
  }
};
```

---

## 🚀 Flujo Ideal de Desarrollo

1. **User Story:** "Registrar cliente con validación"

2. **Define Schema (Frontend)**
   ```typescript
   // lib/validations.ts
   export const ClientSchema = z.object({...});
   ```

3. **Define DTO (Backend)**
   ```typescript
   // modules/clients/dtos/create-client.dto.ts
   export class CreateClientDto {...}
   ```

4. **Implementa UI (Frontend)**
   ```typescript
   <ClientForm onSubmit={handleCreate} />
   ```

5. **Implementa Service (Backend)**
   ```typescript
   @Post()
   create(@Body() createClientDto: CreateClientDto) {...}
   ```

6. **Test End-to-End**
   - ✅ Frontend valida correctamente
   - ✅ Error muestra bonito
   - ✅ Backend rechaza inválidos
   - ✅ Backend acepta válidos
   - ✅ Datos guardados en DB

---

## 💡 Tips

### ✅ **Sincroniza Schemas**
Frontend (Zod) y Backend (Class-Validator) deben tener las mismas reglas.

### ✅ **Mensajes Multiidioma**
Usa el mismo mensaje en ambos lados para consistencia.

### ✅ **Nunca Confíes en Frontend**
Siempre valida en backend, aunque el frontend haya validado.

### ✅ **Error Handling**
Frontend maneja errores de validación (400).
Backend maneja errores de lógica (500).

### ✅ **Testing**
```typescript
// Backend - Test validación
it('should reject invalid email', async () => {
  const dto = { email: 'invalid', password: '123' };
  expect(() => validator.validate(dto)).toThrow();
});

// Frontend - Test UI
it('should show error message for invalid email', () => {
  render(<LoginForm />);
  userEvent.type(screen.getByRole('textbox', { name: /email/ }), 'invalid');
  userEvent.type(screen.getByRole('textbox', { name: /password/ }), '123');
  expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
});
```

---

## 🎯 Conclusión

✅ **Frontend** valida para UX rápido  
✅ **Backend** valida para seguridad  
✅ **Mensajes consistentes** en ambos lados  
✅ **Nunca confíes en el cliente**  
✅ **Siempre valida en servidor**  

¡Sistema de validación enterprise-ready! 🚀
