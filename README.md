# PuppyHub USA Backend API

Backend API for PuppyHub USA adoption platform built with Express.js, TypeScript, and PostgreSQL.

## Features

- **Puppy Management**: Browse and filter available puppies
- **Adoption Applications**: Multi-step application form with validation
- **Email Notifications**: Automatic email confirmations and status updates
- **Admin Dashboard**: Manage applications and puppy listings
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Email**: Nodemailer
- **CORS**: Enabled for frontend integration

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   └── env.ts       # Environment variables
│   ├── lib/             # Utilities
│   │   └── prisma.ts    # Prisma client
│   ├── routes/          # API routes
│   │   ├── puppies.ts   # Puppy endpoints
│   │   └── applications.ts # Application endpoints
│   ├── schemas/         # Zod validation schemas
│   │   └── application.schema.ts
│   ├── services/        # Business logic
│   │   └── email.service.ts
│   └── index.ts         # Main app entry
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email configuration
- `ADMIN_SECRET_KEY`: Secret key for admin authentication
- `FRONTEND_URL`: Frontend application URL

### 3. Setup Database

Generate Prisma client:
```bash
npm run prisma:generate
```

Run migrations:
```bash
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

## API Endpoints

### Puppies
- `GET /api/puppies` - Get all puppies with optional filters
- `GET /api/puppies/:id` - Get puppy by ID
- `GET /api/puppies/breed/:breed` - Get puppies by breed
- `GET /api/puppies/status/available` - Get available puppies

### Applications
- `POST /api/applications` - Submit adoption application
- `GET /api/applications/:id` - Get application by ID
- `GET /api/applications` - Get all applications (admin)
- `PATCH /api/applications/:id/status` - Update application status (admin)

### Health
- `GET /health` - Health check endpoint

## Database Schema

### Puppy
- id, name, breed, gender, birthDate, price
- status (available, reserved, adopted)
- color, generation, vaccinations, notes
- images, sireId, damId

### Application
- Contact information (firstName, lastName, email, phone, address)
- Puppy preferences (breed, size, gender, color, coat type)
- Household info (pets, children, fence, lifestyle)
- Status tracking (submitted, under_review, approved, rejected)

### Reservation
- puppyId, customerEmail, customerName
- status, expiresAt

### AdminUser
- email, password (hashed), firstName, lastName
- role, isActive, lastLoginAt

### EmailLog
- to, subject, type, status, error

## Environment Variables (Production Only)

```
DATABASE_URL=postgresql://user:password@host:5432/puppyhub
PORT=3001
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@puppyhubusa.com
ADMIN_SECRET_KEY=your-super-secret-key
FRONTEND_URL=https://puppyhubusa.com
```

## Development

### Prisma Studio
View and edit database:
```bash
npm run prisma:studio
```

### Build for Production
```bash
npm run build
npm start
```

## License

MIT
