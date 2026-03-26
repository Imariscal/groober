# VibraLive Dashboard - Design System & Architecture

## 🎯 Filosofía de Diseño

**Inspiración**: Stripe, Linear, Vercel, Figma
**Principios**:
- **Minimalista, no vacío**: Whitespace estratégico, no aburrido
- **Jerarquía Clara**: La información importante destaca sin ruido
- **Fluidez**: Transiciones suaves, microinteracciones delightful
- **Contraste Inteligente**: Accesibilidad + estética premium
- **Identidad Fuerte**: VibraLive se siente como un producto premium

---

## 📐 BLUEPRINT ARQUITECTÓNICO

```
┌──────────────────────────────────────────────────────────┐
│                    TOP BAR (64px)                         │
│  [Logo] [Global Search] [Notif] [Avatar] [CTA Button]   │
├────────────┬──────────────────────────────────────────────┤
│            │                                              │
│  SIDEBAR   │        MAIN CONTENT AREA                    │
│  (240px)   │                                              │
│            │  ┌─────────────────────────────────────┐   │
│ • Nav Item │  │ Page Title + Breadcrumb             │   │
│ • Nav Item │  └─────────────────────────────────────┘   │
│ • Nav Item │                                              │
│            │  ┌──────────────┬──────────────────────┐   │
│ [User]     │  │ KPI Card 1   │ KPI Card 2          │   │
│ [Logout]   │  ├──────────────┼──────────────────────┤   │
│            │  │ KPI Card 3   │ KPI Card 4          │   │
│            │  └──────────────┴──────────────────────┘   │
│            │                                              │
│            │  ┌──────────────────┐  ┌──────────────┐   │
│            │  │                  │  │ Recent       │   │
│            │  │  Large Chart     │  │ Activity     │   │
│            │  │    (70%)         │  │   (30%)      │   │
│            │  │                  │  │              │   │
│            │  └──────────────────┘  └──────────────┘   │
│            │                                              │
│            │  ┌──────────────────────────────────┐      │
│            │  │ Data Table / List Panel          │      │
│            │  └──────────────────────────────────┘      │
└────────────┴──────────────────────────────────────────────┘
```

---

## 🎨 SISTEMA DE COLORES

### Paleta Principal
```
Base Neutral:
  - Background: #F8FAFB (gris ultra claro)
  - Surface: #FFFFFF (blanco puro)
  - Border: #E5E7EB (gris 200)
  - Text Primary: #111827 (gris 900)
  - Text Secondary: #6B7280 (gris 500)
  - Text Tertiary: #9CA3AF (gris 400)

Primary (VibraLive):
  - 50: #F0F9FF
  - 100: #E0F2FE
  - 400: #38BDF8
  - 500: #0EA5E9 (brand color)
  - 600: #0284C7
  - 700: #0369A1
  - 900: #082F49

Semantic:
  - Success: #10B981 (verde)
  - Warning: #F59E0B (ámbar)
  - Critical: #EF4444 (rojo)
  - Info: #3B82F6 (azul)
```

### Uso Estratégico
- **Primary Blue**: CTAs, active states, accents
- **Neutrals**: 80% del layout (confianza, profesionalismo)
- **Semantic Colors**: Solo para estados (no decoración)
- **Fondos**: #F8FAFB crea sensación de "aire"

---

## 🔤 TIPOGRAFÍA

```
Font Stack: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif

H1 (Page Title): 32px, 600 weight, line-height 1.2
H2 (Section): 24px, 600 weight, line-height 1.3
H3 (Component): 18px, 600 weight
Body Large: 16px, 400 weight, line-height 1.5
Body Regular: 14px, 400 weight, line-height 1.5
Label: 12px, 500 weight, uppercase, letter-spacing 0.5px
Caption: 12px, 400 weight, color: text-tertiary

Jerarquía visual a través de:
  ✓ Tamaño
  ✓ Weight (400 vs 600)
  ✓ Color (opacity)
  ✗ Decoración innecesaria
```

---

## 📏 ESPACIADOS (Base: 4px)

```
Anatomía Espaciado:
- xs: 4px (entre elementos inline)
- sm: 8px (componente interno)
- md: 12px (espacios relacionados)
- lg: 16px (separación clara)
- xl: 24px (secciones)
- 2xl: 32px (grandes separaciones)
- 3xl: 48px (entre grandes bloques)

Aplicación:
- Padding interior componentes: 16px
- Gap entre items: 8-12px
- Margen entre secciones: 24-32px
- Padding página: 24px
```

---

## 🎯 COMPONENTES CORE

### 1. TOP BAR MODERNA (64px height)

**Estructura**: Logo + Search + Notif + Avatar + CTA

**Características**:
- Fondo: #FFFFFF con subtle border-bottom
- Altura fija: 64px
- z-index: 50 (sticky)
- Flex: space-between con gap-4

**Search Global**:
```
Input: bg-gray-100, rounded-lg, height 40px
Placeholder: "Search clients, pets, events..."
Prefix icon: search-icon (gris)
Onfocus: bg-white + border-primary-500 + shadow-sm
Resultado: dropdown overlay debajo, z-index 51
```

**Notificaciones**:
```
Badge icon con dot rojo si hay notificaciones
Onclick: dropdown con lista de notificaciones
Máx 4 notificaciones visibles + "Ver todo"
Animación: fadeIn + slideDown 200ms
```

**Avatar Section**:
```
Círculo 40x40 con iniciales o imagen
Hover: subtle shadow
Onclick: dropdown menu (Settings, Profile, Logout)
Separador horizontal en el menu
"Logout" al final con color warning
```

**CTA Button**:
```
Primario: bg-primary-500 text-white
Padding: 10px 16px
Border-radius: 6px
Hover: bg-primary-600 + shadow-md
Active: transform scale-95
Transición: all 150ms ease-out
```

---

### 2. SIDEBAR MINIMALISTA (240px)

**Estructura**: Logo + Nav Items + Bottom User Section

**Filosofía**: 
- Oscuro pero no negro (#111827 o #0F172A)
- Iconos + Label (no solo iconos)
- Indicador activo moderno

**Logo Section** (56px):
```
Flex center, border-bottom subtle
Logo: 32x32, brand color
Text: "VibraLive", 14px, 600 weight
Gap: 12px
```

**Nav Items**:
```
Height: 40px per item
Structure: Icon (20px) + Label (14px) + opcional badge
Active: 
  - Izquierda: border-left 3px primary
  - Subtil background: rgba(14, 165, 233, 0.1)
  - Font: 600 weight
Inactive:
  - Hover: bg-gray-700
  - Color: gris-300
  - Font: 400 weight
Transición: all 150ms ease
Gap item: 12px
Padding: 0 16px
```

**Sections**:
```
Label: "PRINCIPAL", "ADMINISTRACIÓN" (12px, uppercase, semi-bold)
Padding: 16px 16px 8px
Color: gris-400/500
```

**Bottom User Section**:
```
Border-top subtle
Padding: 16px
Content: Avatar (32x32) + Name + Email
Name: 14px, 600 weight
Email: 12px, color-tertiary
Gap: 12px
Onclick: profile menu o similar
```

---

### 3. KPI CARDS MODERNAS

**Estructura**: Icon + Metric + Label + Trend (opcional)

```
┌─────────────────────────┐
│  [🔵] > 1,234          │
│                         │
│  Clientes Activos      │
│  ↑ 12% vs mes anterior │
└─────────────────────────┘
```

**Dimensiones**:
- Width: 25% (4 por fila) o responsive
- Min-width: 180px
- Height: auto (content)
- Padding: 20px
- Border-radius: 12px

**Diseño**:
- Background: #FFFFFF
- Border: 1px solid #E5E7EB (subtle)
- Shadow: 0 1px 3px rgba(0,0,0,0.05)
- Hover: shadow-md + border-primary-200

**Componentes internos**:

1. **Icon Circle**:
   - 48x48, border-radius 12px
   - Background: primary color con 10% opacity
   - Icon: 24px, primary color
   - Centered en top-left

2. **Metric**:
   - Font-size: 32px, 700 weight
   - Color: text-primary
   - Line-height: 1.2
   - Margin-top: 16px

3. **Label**:
   - Font-size: 14px, 500 weight
   - Color: text-secondary
   - Margin-top: 4px

4. **Trend Indicator** (opcional):
   - Font-size: 12px
   - Color: success o critical
   - Icon: ↑ verde o ↓ rojo
   - Margin-top: 8px
   - Ejemplo: "↑ 12% vs mes anterior"

**Estados**:
- Loading: skeleton animado
- Empty: icon + texto suave
- Hover: transform translateY(-2px) + shadow-lg

---

### 4. CHARTS SECTION (70% ancho)

**Características**:
- Background: #FFFFFF
- Border-radius: 12px
- Padding: 24px
- Shadow: 0 1px 3px rgba(0,0,0,0.05)

**Header**:
- Título: 18px, 600 weight
- Subtitle: 14px, color-secondary
- Top-right: Período selector (Week/Month/Year)
  - Styled como: inline links, hover primary color

**Chart Area**:
- Altura mínima: 300px
- Línea grid suave: #E5E7EB
- Colores: primary-500 o combinación primary + success
- Animación entrada: stroke animation 600ms

---

### 5. ACTIVITY PANEL (30% ancho)

**Estructura**: Lista de eventos recientes

```
┌──────────────────────┐
│ Actividad Reciente   │
├──────────────────────┤
│ 🔵 Juan registró pet │
│    Hace 2 minutos    │
│                      │
│ 🟢 Cita completada   │
│    Hace 45 minutos   │
│                      │
│ 🟡 Recordatorio env. │
│    Hace 2 horas      │
└──────────────────────┘
```

**Diseño**:
- Background: #FFFFFF
- Border-radius: 12px
- Padding: 24px
- Altura: match con chart

**Items**:
- Flex row: icon + content
- Icon: 32x32, colored circle
- Content: flex column
  - Descripción: 14px, 500 weight
  - Timestamp: 12px, color-tertiary
- Border-bottom entre items (excepto último)
- Padding vertical: 12px

---

### 6. BADGES / ESTADOS MODERNOS

**Pill Badges** (usado en tablas, listas):

```
Tipo: success (verde)
┌──────────────────┐
│ ✓ Activo        │
└──────────────────┘
Padding: 4px 12px
Height: 24px
Border-radius: 12px (pill)
Font: 12px, 500 weight
Background: #ECFDF5 (verde claro)
Color: #059669 (verde oscuro)

Tipo: warning (ámbar)
Background: #FFFBEB
Color: #D97706

Tipo: critical (rojo)
Background: #FEF2F2
Color: #DC2626

Tipo: info (azul)
Background: #EFF6FF
Color: #0369A1
```

---

## ✨ MICROINTERACCIONES

### 1. Hover States
```
Buttons: bg color + shadow-md
Cards: shadow-md + borderColor primaria
Nav items: subtle background change
Links: text-decoration-line underline fade-in
```

### 2. Focus States
```
Inputs: outline-none + border-primary-500 + ring (opcional)
Buttons: ring-primary-400/50
```

### 3. Transiciones
```
Duración estándar: 150-200ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### 4. Loading States
```
Skeleton Components: bg gradient animado
Placeholders: pulse animation de framer-motion
Spinner: 20-24px, primary color, 2s rotation
```

### 5. Feedback Visual
```
Success: toast notificación verde + checkmark
Error: toast notificación roja + exclamation
Warning: toast notificación amarilla
Info: toast notificación azul
Duración: 4s auto-dismiss
```

---

## 🚀 MEJORAS PREMIUM ADICIONALES

### 1. Dark Mode Soporte
```
Toggle en avatar menu
Local storage: preferencia usuario
Automático: respeta system preference
```

### 2. Responsive Design
```
Desktop: 1440px+
Tablet: 768px-1439px (sidebar colapsable)
Mobile: <768px (sidebar drawer, hamburger menu)
```

### 3. Animaciones de Página
```
Entrada: fade-in 300ms
Cambio nav: skeleton fade
Carga datos: loading state progresivo
```

### 4. Accesibilidad (A11y)
```
WCAG 2.1 AA
- Contrast ratio: 4.5:1 mínimo
- Keyboard navigation: completo
- Screen reader: semantic HTML + ARIA labels
- Focus indicators: visible
```

### 5. Performance
```
Code splitting: lazy load pages
Image optimization: next/image
Fuente: system fonts (sin custom fonts)
CSS: Tailwind purged (solo lo usado)
```

---

## 📱 RESPONSIVE BREAKPOINTS

```
Mobile: < 640px
  - Sidebar: drawer overlay (hamburger)
  - KPI: 1 o 2 por fila
  
Tablet: 640px - 1024px
  - Sidebar: colapsable a icons
  - KPI: 2 por fila
  
Desktop: > 1024px
  - Full sidebar expanded
  - KPI: 4 por fila (o configurable)
```

---

## 📊 DATA STRUCTURE EJEMPLO

```typescript
// KPI Card Props
interface KPICard {
  icon: IconComponent;
  metric: number | string;
  label: string;
  trend?: {
    value: number; // percentage
    direction: 'up' | 'down';
    period: string; // "vs mes anterior"
  };
  color?: 'primary' | 'success' | 'warning' | 'critical';
}

// Activity Item
interface ActivityItem {
  id: string;
  icon: IconComponent;
  description: string;
  timestamp: Date;
  type: 'success' | 'warning' | 'info' | 'critical';
}

// Badge Status
type BadgeStatus = 'active' | 'inactive' | 'pending' | 'archived';
```

---

## 🎯 PRÓXIMOS PASOS IMPLEMENTACIÓN

1. ✅ Extender Tailwind config con custom utilities
2. ✅ Crear componentes reutilizables (KPICard, Badge, etc)
3. ✅ Implementar ModernDashboardLayout principal
4. ✅ Crear AdminDashboard page template
5. ✅ Implementar dark mode toggle
6. ✅ Agregar transiciones con framer-motion
7. ✅ Testing & accessibility audit

---

**Filosofía Final**: No es un template, es un producto. Cada pixel tiene intención. Cada transición sirve para algo. El usuario debe sentir que está usando software premium.

