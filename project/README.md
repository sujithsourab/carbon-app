# Carbon Project Documentation Generator

A comprehensive web application for generating and managing carbon project documentation, featuring:

- Interactive project setup and documentation generation
- NDVI analysis with Sentinel Hub integration
- Forest change detection
- Carbon credit calculations
- Real-time collaboration features

## Prerequisites

- Node.js ≥ 18
- pnpm
- Supabase project with Edge Functions enabled
- Sentinel Hub account

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in the following environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   SENTRY_DSN=your_sentry_dsn
   SENTINEL_HUB_CLIENT_ID=your_sentinel_hub_client_id
   SENTINEL_HUB_CLIENT_SECRET=your_sentinel_hub_client_secret
   ```

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Deploy Supabase functions:
   ```bash
   pnpm supabase functions deploy
   ```

## Testing

Run the test suite:
```bash
pnpm test
```

Run linting:
```bash
pnpm lint
```

## Deployment

The project is configured for automatic deployment through GitHub Actions:

1. Push to the `main` branch triggers the CI/CD pipeline
2. Tests and type checking are run
3. On success, the application is deployed to Netlify
4. Edge functions are deployed to Supabase

## Architecture

- Frontend: React + Vite + TypeScript
- State Management: React Context
- Styling: Tailwind CSS
- Authentication: Supabase Auth
- Database: Supabase PostgreSQL
- Edge Functions: Supabase Edge Functions
- Error Tracking: Sentry
- Testing: Jest + React Testing Library

## Features

- Project Documentation Generation
- NDVI Analysis
- Forest Change Detection
- Carbon Credit Calculations
- Real-time Collaboration
- Document Export (DOCX)
- Interactive Maps
- Time Series Analysis