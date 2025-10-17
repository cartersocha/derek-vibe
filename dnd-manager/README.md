# D&D Campaign Manager

A full-stack web application for managing D&D campaigns, sessions, and characters built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 📚 **Campaign Management** - Create and organize multiple campaign storylines
- 🎲 **Session Tracking** - Record session notes, dates, and attach characters
- ⚔️ **Character Management** - Manage character details, stats, and backstories
- 🔐 **Password Protection** - Simple password-based authentication
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: iron-session (password-based)
- **Form Handling**: React Hook Form + Zod validation

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd dnd-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings and copy your:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for server-side operations)

### 4. Create the database schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/20241017_initial_schema.sql`
3. Run the SQL script

### 5. Create storage buckets

In your Supabase dashboard:

1. Go to Storage
2. Create two buckets:
   - `character-images` (make it public)
   - `session-images` (make it public)

### 6. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
APP_PASSWORD=your_chosen_password

# Session Management (generate a random 32+ character string)
SESSION_SECRET=your_32_character_random_string_here
```

**To generate a secure SESSION_SECRET**, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Login

Use the password you set in `APP_PASSWORD` to login.

## Project Structure

```
dnd-manager/
├── app/                      # Next.js App Router pages
│   ├── campaigns/           # Campaign pages
│   ├── sessions/            # Session pages
│   ├── characters/          # Character pages
│   ├── dashboard/           # Dashboard page
│   ├── login/               # Login page
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── layout/             # Layout components (Navbar)
│   └── ui/                 # Reusable UI components
├── lib/                     # Utility libraries
│   ├── actions/            # Server actions (CRUD operations)
│   ├── auth/               # Authentication logic
│   ├── supabase/           # Supabase clients
│   ├── validations/        # Zod schemas
│   └── utils.ts            # Helper functions
├── types/                   # TypeScript type definitions
├── supabase/
│   └── migrations/         # Database migrations
└── middleware.ts           # Auth middleware for route protection
```

## Key Features Explained

### Authentication
- Uses iron-session for secure cookie-based sessions
- Single password authentication (no user accounts needed)
- Middleware protects all dashboard routes

### Campaigns
- Create, edit, and delete campaigns
- View all sessions associated with a campaign
- Optional campaign assignment for sessions

### Sessions
- Create sessions with optional campaign assignment
- Add session date and notes
- Attach multiple characters to a session
- View all characters that participated

### Characters
- Full character sheets with ability scores
- Track race, class, level, and backstory
- View all sessions a character participated in

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This app can be deployed to any platform that supports Next.js:

- [Vercel](https://vercel.com) (recommended)
- [Netlify](https://netlify.com)
- Any Node.js hosting platform

Make sure to set all environment variables in your deployment platform.

## License

MIT
