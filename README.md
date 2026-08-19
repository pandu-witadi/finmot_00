# FINMOT - Financial Monitoring Monorepo

A multiproject financial monitoring system with Fastify backend and React frontend.

## Structure

### Backend (`backend/`)
Fastify Node.js API server with MongoDB.

- **Stack**: Fastify, Mongoose, Zod, TypeScript
- **Port**: 5200
- **DB**: MongoDB (finmot_00)
- **Features**:
  - REST API endpoints
  - SPA serving for frontend
  - CORS enabled
  - Health check endpoint

### Frontend (`frontend/`)
React application with TailwindCSS.

- **Stack**: React 19, Vite, React Router, TailwindCSS 4, shadcn/ui
- **Build**: Outputs to `backend/dist/frontend`
- **Features**:
  - Dashboard & About pages
  - Responsive layout
  - Navigation component

## Quick Start

1. **Backend**:
   ```bash
   cd backend
   pnpm install
   pnpm dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

## Notes

- No formal monorepo tool (NX/Turborepo) - projects managed independently
- Frontend builds to backend's `dist/frontend` for serving
- Environment variables in `backend/.env` and `frontend/.env`
