# PuppyHub Backend - Installation & Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

## Step-by-Step Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

This will install all required packages:
- **express**: Web framework
- **@prisma/client**: Database ORM
- **zod**: Schema validation
- **nodemailer**: Email service
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **typescript**: Type safety

### 2. Setup PostgreSQL Database

Create a new PostgreSQL database:

```bash
createdb puppyhub
```

Or use your preferred PostgreSQL client (pgAdmin, DBeaver, etc.)

### 3. Configure Environment Variables

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/puppyhub"

# Server
PORT=3001
NODE_ENV="production"

# Email Configuration (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@puppyhubusa.com"

# Admin Authentication
ADMIN_SECRET_KEY="your-super-secret-key-change-this-in-production"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

#### Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated password
   - Use this as `SMTP_PASS` in .env

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up relationships and indexes
- Generate Prisma client types

### 6. Seed Initial Data (Optional)

```bash
npm run prisma:seed
```

This populates the database with:
- 4 dog breeds (Maltipoo, Goldendoodle, Labradoodle, Bernedoodle)
- 6 sample puppies
- Ready for testing

### 7. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

Output:
```
🚀 Server running on port 3001
Environment: production
```

## Verify Installation

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T19:00:00.000Z"
}
```

### Fetch Puppies

```bash
curl http://localhost:3001/api/puppies
```

### View Database (Prisma Studio)

```bash
npm run prisma:studio
```

Opens interactive database viewer at `http://localhost:5555`

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment validation
│   ├── lib/
│   │   └── prisma.ts           # Prisma client instance
│   ├── routes/
│   │   ├── puppies.ts          # Puppy endpoints
│   │   ├── applications.ts      # Application endpoints
│   │   ├── breeds.ts           # Breed endpoints
│   │   └── reservations.ts      # Reservation endpoints
│   ├── schemas/
│   │   └── application.schema.ts # Zod validation schemas
│   ├── services/
│   │   └── email.service.ts     # Email sending logic
│   └── index.ts                # Main Express app
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Initial data seeding
├── package.json
├── tsconfig.json
└── .env.example
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open database viewer
npm run prisma:seed     # Seed initial data

# Production
npm run build           # Compile TypeScript
npm start              # Run compiled app
```

## API Endpoints

### Puppies
- `GET /api/puppies` - Get all puppies
- `GET /api/puppies/:id` - Get puppy by ID
- `GET /api/puppies/breed/:breed` - Get puppies by breed
- `GET /api/puppies/status/available` - Get available puppies

### Applications
- `POST /api/applications` - Submit application
- `GET /api/applications/:id` - Get application
- `GET /api/applications` - Get all applications (admin)
- `PATCH /api/applications/:id/status` - Update status (admin)

### Breeds
- `GET /api/breeds` - Get all breeds
- `GET /api/breeds/:id` - Get breed by ID

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/:id` - Get reservation
- `GET /api/reservations` - Get reservations by email
- `PATCH /api/reservations/:id/cancel` - Cancel reservation

### Health
- `GET /health` - Health check

## Troubleshooting

### Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running
2. Check DATABASE_URL is correct
3. Ensure database exists: `createdb puppyhub`

### Email Not Sending

**Error**: `Email send failed`

**Solutions**:
1. Verify SMTP credentials in .env
2. For Gmail: Use App Password (not regular password)
3. Check firewall allows port 587
4. View email logs in database: `EmailLog` table

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev
```

### Prisma Migration Issues

**Error**: `Migration failed`

**Solution**:
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or manually:
npx prisma db push
```

## Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| DATABASE_URL | string | Yes | PostgreSQL connection string |
| PORT | number | No | Server port (default: 3001) |
| NODE_ENV | string | No | Environment (production/development) |
| SMTP_HOST | string | Yes | Email SMTP server |
| SMTP_PORT | number | Yes | Email SMTP port |
| SMTP_USER | string | Yes | Email account username |
| SMTP_PASS | string | Yes | Email account password |
| SMTP_FROM | string | Yes | Sender email address |
| ADMIN_SECRET_KEY | string | Yes | Admin authentication key |
| FRONTEND_URL | string | Yes | Frontend application URL |

## Next Steps

1. ✅ Install dependencies
2. ✅ Setup PostgreSQL
3. ✅ Configure .env
4. ✅ Run migrations
5. ✅ Seed data
6. ✅ Start server
7. 📝 Integrate with frontend
8. 🔒 Setup admin authentication
9. 📧 Test email notifications
10. 🚀 Deploy to production

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review error logs in console
3. Check database with Prisma Studio
4. Review API documentation in README.md
