# Matchify Frontend

React + Vite frontend application for Matchify - Where People & Opportunities Meet.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Query** - Data fetching and caching
- **Wouter** - Routing
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the development server at `http://localhost:5173`

### Build

```bash
npm run build
```

Builds the app for production to the `dist/` directory.

### Type Checking

```bash
npm run check
```

Runs TypeScript type checking without emitting files.

### Preview Production Build

```bash
npm run preview
```

Preview the production build locally.

## Project Structure

This folder is **frontend only**. The API lives in **`../backend-muzz/`** (sibling directory).

```
frontend-muzz/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API service functions
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── shared/         # Shared types and schemas
│   └── assets/         # Static assets
├── public/             # Public static files
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vercel.json         # Vercel deployment configuration
```

## Environment Variables

The **API is a separate app** in `server/` (Express + MySQL). From the repo root, run `npm run dev:backend` to start it on port **5000**.

For the Vite app, you can leave `VITE_API_URL` unset in dev so `/api` is proxied to `localhost:5000`. If you prefer an explicit base URL:

```env
VITE_API_URL=http://localhost:5000
```

For Vercel production, set `VITE_API_URL` to your deployed API origin (the old Render rewrite has been removed).

## Deployment

This frontend is deployed on **Vercel**.

### Vercel Configuration

- **Root Directory**: `.` (root)
- **Output Directory**: `dist`
- **Framework**: Vite
- **Build Command**: `npm run build`

The `vercel.json` file contains the deployment configuration including:
- SPA routing rewrites
- Cache headers for assets
- Build and install commands

## Path Aliases

The project uses TypeScript path aliases:

- `@/*` → `src/*`
- `@shared/*` → `src/shared/*`
- `@assets/*` → `src/assets/*`

Configured in `tsconfig.json` and `vite.config.ts`.

## Features

- 🔐 Authentication & Onboarding
- 👥 User Profiles & Matching
- 💬 Real-time Chat
- 📱 Mobile Responsive
- 🎨 Dark Mode Support
- 🤖 AI-Powered Matchmaking
- 📅 Events & Groups
- 📝 Posts & Stories
- 🎓 Relationship Coaching

## License

MIT

