# VibraLive Backend API

Backend API for VibraLive - Micro-SaaS Veterinary Retention Engine.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Installation

1. **Install Dependencies**
```bash
cd vibralive-backend
npm install
```

2. **Start Infrastructure (PostgreSQL, Redis)**
```bash
# From project root
docker-compose up -d
```

3. **Setup Environment**
```bash
# Copy example env
cp .env.example .env.local

# Edit with your settings (optional - defaults are for local dev)
```

4. **Initialize Database**
```bash
# Run migrations (when available)
npm run migration:run

# Seed with test data
npm run seed
```

5. **Start Dev Server**
```bash
npm run start:dev
```

Server will start at: `http://localhost:3000`

Health check: `curl http://localhost:3000/health`

## Development Commands

```bash
npm run build          # Build for production
npm run start:prod     # Start production build
npm run start:dev      # Start with watch mode
npm run lint           # Run ESLint
npm run test           # Run unit tests
npm run test:cov       # With coverage report
```

## Database

### Migrations
```bash
npm run migration:create -- --name=CreateUsersTable
npm run migration:generate -- --name=AddPhoneToUsers
npm run migration:run
npm run migration:revert
```

### Seeding
```bash
npm run seed
```

Test credentials after seeding:
- Owner: `owner@vibralive.test` / `Admin@123456`
- Staff: `staff@vibralive.test` / `Staff@123456`

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new clinic

### Users
- `POST /api/users` - Create user (owner only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user (owner only)
- `DELETE /api/users/:id` - Delete user (owner only)

### Clients
- `POST /api/clients` - Create client
- `GET /api/clients` - List clients (paginated)
- `GET /api/clients/:id` - Get client with pets
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Pets
- `POST /api/pets` - Create pet
- `GET /api/pets/client/:clientId` - Get client's pets
- `GET /api/pets/upcoming` - Get pets with upcoming reminders
- `GET /api/pets/:id` - Get pet details
- `PATCH /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet

### Animal Types
- `GET /api/animal-types` - List animal types
- `POST /api/animal-types` - Create type (owner only)
- `PATCH /api/animal-types/:id` - Update type (owner only)
- `DELETE /api/animal-types/:id` - Delete type (owner only)

## Project Structure

```
vibralive-backend/
├── src/
│   ├── database/
│   │   ├── entities/          # TypeORM entities
│   │   ├── migrations/        # Database migrations
│   │   ├── seeds/            # Seed data
│   │   └── data-source.ts    # TypeORM config
│   ├── modules/
│   │   ├── auth/            # Authentication
│   │   ├── users/           # User management
│   │   ├── clients/         # Client management
│   │   ├── pets/            # Pet management
│   │   └── animal-types/    # Animal type management
│   ├── common/
│   │   ├── guards/          # Auth guards
│   │   ├── decorators/      # Custom decorators
│   │   ├── filters/         # Exception filters
│   │   └── middleware/      # Custom middleware
│   ├── config/              # Configuration services
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   └── main.ts              # Entry point
├── test/                    # Tests
├── Dockerfile               # Production image
├── .dockerignore
├── docker-compose.yml       # Local development services
└── package.json
```

## Authentication

All protected endpoints require JWT token in Authorization header:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users
```

Token structure (JWT payload):
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "clinic_id": "clinic-uuid",
  "role": "owner|staff"
}
```

## Security

- Passwords hashed with bcrypt
- JWT for API authentication
- CORS enabled for configured origins
- Rate limiting (TODO: implement)
- Security headers (X-Frame-Options, CSP, etc.)
- Secrets in environment variables or Azure Key Vault

## Database Schema

See [SCHEMA.md](SCHEMA.md) for complete schema documentation.

### Key Tables
- `clinics` - Multi-tenant root
- `users` - Clinic staff
- `clients` - Pet owners
- `pets` - Animal records
- `animal_types` - Configurable pet categories
- `reminders` - Automated reminder tracking
- `message_logs` - WhatsApp message audit trail

## Error Handling

API returns standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Validation error or error description",
  "error": "BadRequest"
}
```

## Logging

Winston logger configured in production.

- Log level: `process.env.LOG_LEVEL` (debug, info, warn, error)
- Logs include: HTTP requests, errors, database operations
- Structured logging for Application Insights integration

## Docker

### Build Image
```bash
docker build -t vibralive-api:latest .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_HOST=postgres \
  -e DATABASE_USER=vibralive_dev \
  -e DATABASE_PASSWORD=vibralive_password \
  -e DATABASE_NAME=vibralive_db \
  -e JWT_SECRET=your-secret \
  vibralive-api:latest
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Azure deployment instructions.

## TODO (Phase 1)

- [ ] Reminders module (scheduler)
- [ ] WhatsApp webhook integration
- [ ] Message logging and delivery tracking
- [ ] Rate limiting middleware
- [ ] Automated tests
- [ ] OpenAPI/Swagger documentation
- [ ] Azure Functions integration
- [ ] Application Insights logging

## Support

For issues or questions, contact the VibraLive team.

