# VibraLive Frontend

React + Next.js 14 frontend para el Micro-SaaS VibraLive.

## Quick Start

### Requirements
- Node.js 20+
- npm o yarn

### Installation

```bash
cd vibralive-frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
vibralive-frontend/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Protected routes
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and API client
│   ├── store/                # Zustand stores
│   └── types/                # TypeScript types
├── public/                   # Static assets
├── package.json
├── tailwind.config.js        # Tailwind CSS config
└── tsconfig.json
```

## Features

- ✅ Authentication (Login/Register)
- ⏳ Protected routes with role-based access
- 🎯 Dashboard with client and pet management
- 📱 Responsive design with Tailwind CSS
- 🔴 Real-time error handling with toast notifications
- 💾 State management with Zustand

## Configuration

Environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Change `NEXT_PUBLIC_API_URL` to your backend API URL.

## Testing

```bash
npm run test
npm run test:watch
npm run test:cov
```

## Type Checking

```bash
npm run type-check
```

## Linting

```bash
npm run lint
```

## Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Framer Motion** - Animations
- **React Icons** - Icon library

## API Integration

All API calls go through `src/lib/api-client.ts` which:

- Handles authentication tokens
- Manages request/response interceptors
- Provides automatic redirect on 401 errors
- Has typed methods for common HTTP verbs

Example usage:

```typescript
import { apiClient } from '@/lib/api-client';

const clients = await apiClient.get('/api/clients');
const newClient = await apiClient.post('/api/clients', { name: 'Juan' });
```

## Authentication

The app uses JWT tokens stored in localStorage:

- **access_token** - JWT token for API authentication
- **user** - User information JSON

Login/register flows:

1. User submits credentials
2. Backend returns `access_token` and `user` object
3. Token is stored in localStorage and used for API requests
4. On 401 response, token is cleared and user is redirected to login

## Pages

### Public Pages
- `/auth/login` - Login form
- `/auth/register` - Registration form

### Protected Pages (Dashboard)
- `/dashboard` - Home page
- `/dashboard/clients` - Client list and management
- `/dashboard/pets` - Pet management
- `/dashboard/reminders` - Reminder status
- `/dashboard/logs` - Message logs and audit trail
- `/dashboard/admin/*` - Admin section (owner only)

## Development Tips

1. **Working with Components**
   - Use `'use client'` directive at the top of interactive components
   - Server components by default for better performance

2. **API Calls**
   - Always use `apiClient` for HTTP requests
   - Catch and handle errors with toast notifications

3. **State Management**
   - Use custom hooks (e.g., `useAuth`) for complex logic
   - Store UI state in Zustand for cross-component access

4. **Styling**
   - Use Tailwind utility classes
   - Custom styles in `globals.css` or component CSS modules
   - Color theme: Primary (blue), Success (green), Warning (amber), Danger (red)

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Azure Static Web Apps

1. Create Static Web App resource
2. Connect GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Output location: `.next`

### Docker

```bash
docker build -t vibralive-frontend:latest .
docker run -p 3000:3000 vibralive-frontend:latest
```

## Contributing

Follow the existing code style and patterns. All commits should have meaningful messages.

## License

PROPRIETARY - VibraLive Team
