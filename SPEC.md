# D&D Campaign Manager - Technical Specification

## 1. Project Overview

**Name**: D&D Campaign Manager  
**Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase  
**Architecture**: Full-stack Next.js with Supabase for authentication and database

## 2. Database Schema (Supabase PostgreSQL)

### Tables

#### `campaigns`

- `id` (uuid, PK)
- `name` (text, required)
- `description` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `sessions`

- `id` (uuid, PK)
- `campaign_id` (uuid, FK to campaigns.id, nullable)
- `name` (text, required)
- `session_date` (date)
- `notes` (text)
- `header_image_url` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `characters`

- `id` (uuid, PK)
- `name` (text, required)
- `race` (text)
- `class` (text)
- `level` (integer)
- `backstory` (text)
- `image_url` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `session_characters` (junction table)

- `id` (uuid, PK)
- `session_id` (uuid, FK to sessions.id)
- `character_id` (uuid, FK to characters.id)
- `created_at` (timestamp)
- Unique constraint on (session_id, character_id)

### Supabase Storage Buckets

- `character-images` - Store character profile images
- `session-images` - Store session header images
- Public read access, authenticated write access

### Database Policies

- No Row Level Security (RLS) needed - basic password protection handles all access
- Cascade deletes: Deleting a campaign deletes sessions, deleting sessions removes session_characters entries

## 3. Application Structure

### Pages & Routes (App Router)

```
app/
├── page.tsx                          # Landing/Home page
├── layout.tsx                        # Root layout with auth provider
├── globals.css                       # Tailwind imports
├── login/
│   └── page.tsx                      # Password login page
├── (protected)/
│   ├── layout.tsx                    # Dashboard layout with nav
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard overview
│   ├── campaigns/
│   │   ├── page.tsx                  # Campaigns list
│   │   ├── [id]/
│   │   │   └── page.tsx              # Campaign detail/edit
│   │   └── new/
│   │       └── page.tsx              # New campaign
│   ├── sessions/
│   │   ├── page.tsx                  # Sessions list
│   │   ├── [id]/
│   │   │   └── page.tsx              # Session detail/edit
│   │   └── new/
│   │       └── page.tsx              # New session
│   └── characters/
│       ├── page.tsx                  # Characters list
│       ├── [id]/
│       │   └── page.tsx              # Character detail/edit
│       └── new/
│           └── page.tsx              # New character
└── api/
    └── (future REST endpoints if needed)
```

## 4. Component Architecture

### Core Components

#### Layout Components

- `Navbar` - Top navigation with user menu
- `Sidebar` - Side navigation for dashboard sections
- `DashboardLayout` - Wrapper for authenticated pages

#### Feature Components

- `CampaignCard` - Display campaign summary
- `CampaignForm` - Create/edit campaign
- `SessionCard` - Display session summary
- `SessionForm` - Create/edit session with character selection
- `CharacterCard` - Display character summary
- `CharacterForm` - Create/edit character with attributes
- `CharacterSelector` - Multi-select for attaching characters to sessions
- `SessionList` - Display sessions for a character

#### UI Components (shadcn/ui recommended)

- `Button`
- `Input`
- `Textarea`
- `Card`
- `Select`
- `Dialog/Modal`
- `Tabs`
- `Badge`
- `Spinner/Loading`
- `Toast` notifications
- `ImageUpload` - File upload with preview
- `ImageDisplay` - Display uploaded images with fallback

## 5. Features & Functionality

### Authentication (Basic Password Protection)

- Single password for app access (stored in environment variable)
- Session-based authentication using Next.js middleware
- Cookie-based session management
- Protected routes for all dashboard pages
- Logout functionality clears session
- No user accounts or registration needed

### Campaigns

- Create, read, update, delete campaigns
- List all campaigns
- Associate multiple sessions with a campaign
- Optional campaign assignment (sessions can exist without campaigns)

### Sessions

- Create, read, update, delete sessions
- Assign to campaign (optional)
- Set session date
- Rich text notes editor
- Upload and display header image
- Image stored in Supabase Storage
- Attach multiple characters
- View/edit character list within session
- Filter sessions by campaign

### Characters

- Create, read, update, delete characters
- Upload and display character image
- Image stored in Supabase Storage
- Character race and class
- Level tracking
- Backstory (long text)
- View all sessions character has participated in
- Filter/search characters

### Image Management

- Upload images for characters and sessions
- Image preview before upload
- Store images in Supabase Storage buckets
- Automatic image optimization (optional)
- Delete old images when updating
- Supported formats: JPG, PNG, WebP
- Max file size: 5MB

### Dashboard

- Overview statistics (total campaigns, sessions, player character count, non-player character count)
- 3 most recent sessions
- Quick actions (create new campaign/session/character)

## 6. Technical Implementation Details

### State Management

- React Server Components for data fetching
- Client components for interactivity
- Supabase Realtime for live updates (optional Phase 2)

### Data Fetching

- Server Components fetch data directly from Supabase
- Server Actions for mutations (create, update, delete)
- Optimistic updates on client where appropriate

### Styling

- Tailwind CSS utility classes
- CSS variables for theme colors
- Responsive design (mobile-first)
- Dark mode support (optional Phase 2)

### Form Handling

- React Hook Form for form state
- Zod for validation schemas
- Error handling and display

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= (for server-side only)
APP_PASSWORD= (single password for app access)
SESSION_SECRET= (for encrypting session cookies)
```

## 7. File Structure

```
derek-vibe/
├── app/                              # Next.js app directory
├── components/                       # React components
│   ├── ui/                          # Base UI components
│   ├── campaigns/                   # Campaign-specific components
│   ├── sessions/                    # Session-specific components
│   ├── characters/                  # Character-specific components
│   └── layout/                      # Layout components
├── lib/                             # Utilities
│   ├── supabase/
│   │   ├── client.ts               # Client-side Supabase client
│   │   ├── server.ts               # Server-side Supabase client
│   │   └── storage.ts              # Image upload utilities
│   ├── auth/
│   │   ├── session.ts              # Session management
│   │   └── middleware.ts           # Auth middleware
│   ├── validations/                # Zod schemas
│   └── utils.ts                    # Helper functions
├── types/                           # TypeScript types
│   ├── database.ts                 # Supabase generated types
│   └── index.ts                    # App-specific types
├── supabase/
│   └── migrations/                 # Database migrations
├── public/                          # Static assets
├── .env.local                       # Environment variables
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 8. TypeScript Types

### Core Types

```typescript
interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Session {
  id: string;
  campaign_id: string | null;
  name: string;
  session_date: string | null;
  notes: string | null;
  header_image_url: string | null;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
  characters?: Character[];
}

interface Character {
  id: string;
  name: string;
  race: string | null;
  class: string | null;
  level: number | null;
  backstory: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  sessions?: Session[];
}
```

## 9. Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0"
  }
}
```

## 10. Development Phases

### Phase 1: Core Setup

1. Initialize Next.js project with TypeScript
2. Configure Tailwind CSS
3. Set up Supabase project and connection
4. Create database schema and migrations
5. Set up Supabase Storage buckets for images
6. Implement basic password authentication with session management

### Phase 2: Core Features

1. Build image upload functionality
2. Build Campaign CRUD
3. Build Session CRUD with header image upload
4. Build Character CRUD with image upload
5. Implement session-character relationships

### Phase 3: Polish

1. Add dashboard with statistics
2. Improve UI/UX
3. Add loading states and error handling
4. Responsive design refinements

### Phase 4: Enhancements (Optional)

1. Rich text editor for notes
2. Image optimization and resizing
3. Search and filtering
4. Export functionality
5. Dark mode
6. Drag and drop image uploads
