# Cloudflare Workers Setup

This directory contains the Cloudflare Workers that replace Supabase functionality.

## Structure

- `auth/` - Authentication worker (login, signup, JWT management)
- `api/` - Main API worker (projects, files, analysis)
- `database/` - Database schema for Cloudflare D1

## Setup Instructions

### 1. Install Dependencies

```bash
cd workers/auth
npm install

cd ../api
npm install
```

### 2. Create Cloudflare D1 Database

```bash
# Create the database
wrangler d1 create carbon-projects-db

# Note the database ID from the output and update wrangler.toml files
```

### 3. Initialize Database Schema

```bash
# Apply the schema
wrangler d1 execute carbon-projects-db --file=../database/schema.sql
```

### 4. Create R2 Bucket for File Storage

```bash
wrangler r2 bucket create carbon-project-files
```

### 5. Set Environment Variables

Update the `wrangler.toml` files with your actual values:

- `database_id`: Your D1 database ID
- `JWT_SECRET`: A secure random string for JWT signing
- `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)

### 6. Deploy Workers

```bash
# Deploy auth worker
cd auth
wrangler deploy

# Deploy API worker
cd ../api
wrangler deploy
```

### 7. Update Frontend Environment Variables

Create a `.env` file in the root directory:

```env
VITE_CLOUDFLARE_AUTH_URL=https://carbon-auth-worker.your-subdomain.workers.dev
VITE_CLOUDFLARE_API_URL=https://carbon-api-worker.your-subdomain.workers.dev
```

## Features Migrated

### Authentication
- ✅ User registration and login
- ✅ JWT token management
- ✅ Password hashing with bcrypt

### Project Management
- ✅ Create and retrieve projects
- ✅ Store project documents
- ✅ File upload to R2 storage

### Analysis Features
- ✅ NDVI analysis (mock implementation)
- ✅ Forest change analysis (mock implementation)
- ✅ Project area management

### File Storage
- ✅ File upload to Cloudflare R2
- ✅ Document text extraction (basic implementation)

## Development

```bash
# Run auth worker locally
cd auth
wrangler dev

# Run API worker locally (in another terminal)
cd api
wrangler dev --port 8788
```

## Production Deployment

1. Update `wrangler.toml` files with production settings
2. Deploy both workers: `wrangler deploy`
3. Update frontend environment variables with production URLs
4. Test all functionality

## Cost Considerations

- **D1 Database**: 25 million reads/month free, then $0.001 per 1000 reads
- **R2 Storage**: 10 GB storage free, then $0.015/GB/month
- **Workers**: 100,000 requests/day free, then $0.50 per million requests

This setup provides a cost-effective alternative to Supabase with similar functionality.