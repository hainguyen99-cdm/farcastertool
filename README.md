# Farcaster Interaction Tool

A monorepo application for managing Farcaster interactions with Next.js frontend and NestJS backend.

## Project Structure

```
farcaster/
├── frontend/          # Next.js 15.5.2 application (Port 3000)
├── backend/           # NestJS application (Port 3002)
└── .taskmaster/       # Task management files
```

## Environment Setup

### Backend Environment Variables

Copy `backend/env.example` to `backend/.env` and configure:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost/farcaster-tool

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3002
NODE_ENV=development

# Encryption Key (generate a secure key for production)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Farcaster API Configuration
FARCASTER_API_URL=https://client.farcaster.xyz
```

### Frontend Environment Variables

Copy `frontend/env.example` to `frontend/.env.local` and configure:

```bash
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3002

# Environment
NODE_ENV=development
```

## Prerequisites

- Node.js 18+ 
- MongoDB (running on localhost:27017)
- Redis (running on localhost:6379)

## Getting Started

1. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Start MongoDB and Redis services**

3. **Start the applications:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run start:dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

4. **Access the applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3002

## API Endpoints

- `GET /` - Health check
- `GET /test-mongodb` - Test MongoDB connection
- `GET /test-redis` - Test Redis connection
- `POST /add-test-job` - Add a test job to the queue

## Features Implemented

- ✅ Monorepo structure with frontend and backend
- ✅ Next.js frontend with TypeScript
- ✅ NestJS backend with TypeScript
- ✅ MongoDB integration with Mongoose
- ✅ Redis and BullMQ for task queues
- ✅ Environment variable configuration
- ✅ Test endpoints for all services
