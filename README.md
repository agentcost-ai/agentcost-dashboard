# AgentCost Dashboard

**Analytics dashboard for monitoring your LLM costs and managing projects.**

A Next.js 14 application with App Router, Tailwind CSS, and Recharts for visualizing your AI spending and managing your projects.

## Features

- **Real-time Analytics**: See costs, calls, and tokens at a glance
- **Interactive Charts**: Cost trends, agent breakdowns, model usage
- **Agent Insights**: Per-agent cost analysis
- **Project Management**: Create and manage projects, invite team members
- **User Authentication**: Secure login and registration
- **Feedback System**: Submit and track feature requests
- **File Attachments**: Upload and manage files
- **Auto-Refresh**: Stay up-to-date with automatic data refresh
- **Dark Mode**: Modern, eye-friendly design
- **Responsive**: Works on desktop and mobile

## Quick Start

### 1. Install Dependencies

```bash
cd agentcost-dashboard
npm install
```

### 2. Configure Environment

```bash
# Copy example config
cp .env.example .env.local

# Edit with your settings
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_API_KEY=sk_your_project_api_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard (Overview)
│   ├── layout.tsx         # Root layout with Sidebar
│   ├── agents/            # Per-agent analytics
│   ├── models/            # Per-model analytics
│   ├── events/            # Event log viewer
│   └── settings/          # API key configuration
├── components/
│   ├── charts/            # Recharts visualizations
│   │   ├── CostChart.tsx  # Cost over time
│   │   ├── AgentChart.tsx # Per-agent breakdown
│   │   └── ModelChart.tsx # Per-model breakdown
│   ├── layout/
│   │   ├── Sidebar.tsx    # Navigation sidebar
│   │   └── TimeRangeSelector.tsx
│   └── ui/                # Reusable UI components
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Table.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── api.ts             # API client for backend
│   └── utils.ts           # Formatting utilities
└── hooks/
    └── useAutoRefresh.ts  # Auto-refresh hook
```

## Pages

| Page     | URL         | Description                                |
| -------- | ----------- | ------------------------------------------ |
| Overview | `/`         | Main dashboard with key metrics and charts |
| Projects | `/projects` | Project management and team collaboration  |
| Agents   | `/agents`   | Per-agent cost breakdown and performance   |
| Models   | `/models`   | Per-model usage and cost analysis          |
| Events   | `/events`   | Real-time event log viewer                 |
| Feedback | `/feedback` | Submit and track feature requests          |
| Settings | `/settings` | User profile and API key configuration     |
| Login    | `/login`    | User authentication                        |
| Register | `/register` | User registration                          |

## Configuration

All configuration is done via environment variables:

| Variable              | Description                | Default                 |
| --------------------- | -------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL            | `http://localhost:8000` |
| `NEXT_PUBLIC_API_KEY` | Default API key (optional) | -                       |
| `NEXTAUTH_SECRET`     | NextAuth.js secret         | -                       |
| `NEXTAUTH_URL`        | NextAuth.js URL            | `http://localhost:3000` |

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts 3
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Production Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Static Export

```bash
# Build static files
npm run build

# Deploy to any static host (Netlify, Cloudflare Pages, etc.)
```

## Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
