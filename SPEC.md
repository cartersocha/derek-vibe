# D&D Campaign Manager - Technical Specification

## 1. Project Overview

**Name**: D&D Campaign Manager  
**Stack**: Next.js 15.5.6 (App Router), TypeScript, Tailwind CSS, Supabase  
**Architecture**: Full-stack Next.js with Supabase for database  
**Storage**: Vercel Blob Storage for images  
**Authentication**: Simple password-based authentication with iron-session

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

### Vercel Blob Storage

- Character images stored in Vercel Blob Storage
- Public read access via CDN URLs
- Automatic file naming: `character-images/characters/{character-id}/{filename}`
- Max file size: 5MB
- Supported formats: JPG, PNG, WebP, GIF
- Files served from Vercel's global CDN

### Database Policies

- No Row Level Security (RLS) needed - basic password protection handles all access
- Cascade deletes: Deleting a campaign deletes sessions, deleting sessions removes session_characters entries

## 3. Application Structure

### Pages & Routes (App Router)

```typescript
app/
├── globals.css                       # Tailwind imports and custom styles
├── login/
│   └── page.tsx                      # Password login page
├── dashboard/
  - List of participating characters with links laid out in a 1/3/5 responsive grid to surface more attendees at a glance
  - Character roster chips reused across dashboards, campaign lists, and character histories with capped visible badges and a "+N more" indicator for overflow
│   ├── layout.tsx                    # Campaigns layout with nav
│   ├── page.tsx                      # Campaigns list
│   ├── [id]/
│   └── new/
│       └── page.tsx                  # New campaign form
│   ├── layout.tsx                    # Sessions layout with nav
│   ├── page.tsx                      # Sessions list
│   ├── [id]/
  - 6 most recent sessions with dates, campaign-aware session numbers, player badge chips (with overflow counter), and note previews
│   └── new/
│       └── page.tsx                  # New session form
└── characters/
    ├── layout.tsx                    # Characters layout with nav
    ├── page.tsx                      # Characters list
    │   └── edit/
    │       └── page.tsx              # Character edit page
    └── new/
        └── page.tsx                  # New character form
```

**Note**: The home page (`/`) automatically redirects to `/dashboard`, which then redirects unauthenticated users to `/login` via middleware.

## 4. Component Architecture

### Core Components

#### Layout Components

- `Navbar` - Collapsible sidebar navigation with icon mode, hover tooltips, throttled drag resizing, and intelligent width clamping
  - Location: `components/layout/navbar.tsx`
  - Client component with requestAnimationFrame throttled resizing, width persistence, mobile menu, dynamic max-width measurement that hugs the longest label, and double-click toggles on both the panel and resize handle

#### Form Components

- `CharacterEditForm` - Edit existing character with auto-resizing text areas
  - Location: `components/forms/character-edit-form.tsx`
  - Client component with form state management
- `SessionForm` - Create/edit session with character selection and draft auto-save
  - Location: `components/forms/session-form.tsx`
  - Client component with search, hidden selection syncing, and redirect-aware character creation

#### UI Components

- `AutoResizeTextarea` - Textarea that grows with content for long-form inputs using animation frame throttling
  - Location: `components/ui/auto-resize-textarea.tsx`
  - Client component shared by character and session forms for backstory and notes
- `CharacterSearch` - Characters index wrapper with inline search and responsive card grid
  - Location: `components/ui/character-search.tsx`
  - Client component providing compact search input, empty-state messaging, and a five-column responsive layout for character cards
- `ImageUpload` - File upload with preview and remove functionality
  - Location: `components/ui/image-upload.tsx`
  - Client component with drag-and-drop support
  - Preview current image and new uploads
  - Remove image functionality
- `DeleteCharacterButton` - Confirmation dialog for character deletion
  - Location: `components/ui/delete-character-button.tsx`
  - Client component with confirmation prompt
- `DeleteSessionButton` - Confirmation dialog for session deletion
  - Location: `components/ui/delete-session-button.tsx`
  - Client component with confirmation prompt
- `DeleteCampaignButton` - Confirmation dialog for campaign deletion
  - Location: `components/ui/delete-campaign-button.tsx`
  - Client component with confirmation prompt

## 5. Features & Functionality

### Authentication (Basic Password Protection)

- Single password for app access (stored in environment variable: `APP_PASSWORD`)
- Session-based authentication using iron-session
- Cookie-based session management with encryption
- Protected routes via Next.js middleware
- Logout endpoint remains available for manual use, but the UI omits a logout control per UX guidance
- No user accounts or registration needed
- Session persists across browser sessions

### Campaigns

- Create, read, update, delete campaigns
- List all campaigns with session count
- View campaign details with associated sessions
- Optional campaign assignment (sessions can exist without campaigns)
- Campaigns display:
  - Name and description
  - Total sessions count
  - Created and last updated dates
  - List of all sessions in campaign

### Sessions

- Create, read, update, delete sessions
- Assign to campaign (optional)
- Set session date
- Plain text notes field with auto-resizing textarea and localStorage draft auto-save
- Upload and display header image (stored in Supabase Storage)
- Attach multiple characters to a session
- View/edit character list within session
- Character picker supports search, preserves hidden selections, and links to create-new flow that returns with the new character preselected
- Character selections auto-save locally during session creation so chosen attendees persist while drafting
- Session name and header image selections are cached locally and restored when returning to an in-progress draft
- Session date defaults to the current day on creation while respecting existing values during edits
- The first available campaign is preselected during session creation when no campaign query parameter is provided
- Display list of characters that participated
- Session detail view shows:
  - Header image (if uploaded)
  - Campaign association
  - Session date
  - Notes presented in a styled panel with preserved line breaks
  - List of participating characters with links laid out in a 1/3/5 responsive grid to surface more attendees at a glance
  - Player chips reused across dashboard, campaigns, and character detail pages with overflow condensed into a `+N more` badge
- Campaign-specific ordering assigns a session number based on ascending session date; numbering appears on the sessions list, campaign detail cards, and session detail header when a campaign provides dated entries
- Unsaved session note drafts persist locally across navigation and are cleared after a successful submission to prevent data loss

#### Sessions Index

- Inline search input styled consistently with the character tab, filtering by session name, campaign name, notes, and attendee names
- Player chips on each card are capped at four visible entries with a `+N more` overflow indicator for dense parties
- Search control automatically disables when no sessions exist to avoid unnecessary input handling

### Characters

- Create, read, update, delete characters
- Upload and display character portrait image (stored in Vercel Blob Storage)
- Character attributes:
  - Name (required)
  - Race
  - Class
  - Level (1-20)
  - Backstory/notes (long text)
- Character selection lists render race and class with a separator dot instead of parentheses for clarity
- View all sessions character has participated in with inline player chips showing fellow attendees (capped at four visible with overflow indicator)
- Character detail view shows:
  - Portrait image (if uploaded)
  - Race, class, and level
  - Backstory & Notes section with preserved line breaks that wraps around the infobox for readability
  - List of sessions they participated in with links
- **Note**: Ability scores (STR, DEX, CON, INT, WIS, CHA) have been removed from the system
- Characters index includes a compact inline search field beside the create button and renders results in a responsive five-card-wide grid with graceful empty states when no matches are found

### Image Management

- Upload images for characters only (sessions do not have images)
- Image preview before upload with drag-and-drop support
- Store images in Vercel Blob Storage with public CDN access
- Delete old images when updating/removing
- Supported formats: JPG, PNG, WebP, GIF
- Max file size: 5MB
- Images served via Vercel's global CDN for fast delivery

### Dashboard

- Overview statistics:
  - Total campaigns count
  - Total sessions count
  - Total characters count
- Recent activity:
  - Up to 6 most recent sessions with campaign-aware session numbers, scheduled dates, note previews, and attendee chips with overflow indicators
- Cyberpunk-themed UI with neon accents

## 6. Technical Implementation Details

### State Management

- React Server Components for data fetching (default)
- Client Components marked with 'use client' for interactivity
- Server Actions for all mutations (create, update, delete)
- Form submissions use Server Actions
- No client-side state management library needed
- Client-visible form inputs are sanitized server-side with `sanitize-html` before validation or persistence

### Data Fetching

- Server Components fetch data directly from Supabase using createClient()
- Server Actions for mutations (create, update, delete)
- revalidatePath() for cache invalidation after mutations
- redirect() for navigation after successful mutations
- No client-side data fetching libraries needed

### Styling

- Tailwind CSS utility classes
- Custom cyberpunk theme with neon colors:
  - Primary: Cyan (#00ffff)
  - Secondary: Magenta (#ff00ff)
  - Background: Dark purple/navy (#0f0f23, #1a1a3e)
- CSS variables for consistent theming
- Responsive design (mobile-first approach)
- Backdrop blur effects for modern glassmorphism
- Custom fonts: Space Grotesk (headings), Fira Code (monospace)


> **Note (2025-10-17):** Completed a mobile responsiveness pass that adds a collapsible mobile navigation, stacks action bars on small screens, and widens primary controls for better touch targets.

> **Note (2025-10-18):** Landed sidebar performance improvements, session form draft preservation, auto-resizing text areas, and refreshed character metadata formatting.

> **Note (2025-10-18, evening):** Added campaign-aware session numbering across list and detail views, tightened related character grids to fit five cards, introduced a compact character search bar with responsive results, and refined the sidebar to auto-clamp to label width with double-click toggles.


### Form Handling

- Native HTML forms with Server Actions
- Zod for validation schemas (lib/validations/schemas.ts)
- FormData API for form submissions
- Error handling via try/catch in Server Actions
- Client-side validation with HTML5 attributes
- File uploads handled through FormData
- Session notes auto-save to `localStorage` with a debounce and clear on successful submission
- Autosaved drafts are purged if the user leaves the form without submitting to avoid stale resumes
- Auto-resizing textarea component keeps long-form inputs visible without manual resizing

### Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx

# Authentication
APP_PASSWORD=your-secure-password
SESSION_SECRET=your-32-character-random-string
```

**Note**: Vercel Analytics is included but doesn't require environment variables - it works automatically when deployed to Vercel.

## 7. File Structure

```typescript
dnd-manager/
├── app/                              # Next.js app directory
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page (redirects to dashboard)
│   ├── globals.css                   # Global styles and Tailwind
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── dashboard/
│   │   ├── layout.tsx                # Dashboard layout
│   │   └── page.tsx                  # Dashboard with stats
│   ├── campaigns/
│   │   ├── layout.tsx                # Campaigns layout
│   │   ├── page.tsx                  # Campaigns list
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Campaign detail
│   │   │   └── edit/
│   │   │       └── page.tsx          # Edit campaign
│   │   └── new/
│   │       └── page.tsx              # New campaign
│   ├── sessions/
│   │   ├── layout.tsx                # Sessions layout
│   │   ├── page.tsx                  # Sessions list
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Session detail
│   │   │   └── edit/
│   │   │       └── page.tsx          # Edit session
│   │   └── new/
│   │       └── page.tsx              # New session
│   └── characters/
│       ├── layout.tsx                # Characters layout
│       ├── page.tsx                  # Characters list
│       ├── [id]/
│       │   ├── page.tsx              # Character detail
│       │   └── edit/
│       │       └── page.tsx          # Edit character
│       └── new/
│           └── page.tsx              # New character
├── components/                       # React components
│   ├── ui/                          # Reusable UI components
│   │   ├── auto-resize-textarea.tsx # Auto-growing textarea component
│   │   ├── image-upload.tsx         # Image upload component
│   │   ├── delete-character-button.tsx
│   │   ├── delete-session-button.tsx
│   │   └── delete-campaign-button.tsx
│   ├── forms/                       # Form components
│   │   ├── character-edit-form.tsx  # Character edit form
│   │   └── session-form.tsx         # Session form with character select
│   └── layout/                      # Layout components
│       └── navbar.tsx               # Navigation bar
├── lib/                             # Utilities and helpers
│   ├── supabase/
│   │   ├── client.ts               # Client-side Supabase client
│   │   ├── server.ts               # Server-side Supabase client
│   │   └── storage.ts              # Vercel Blob image upload/delete utilities
│   ├── auth/
│   │   ├── session.ts              # iron-session configuration
│   │   └── actions.ts              # Auth server actions
│   ├── actions/                    # Server actions
│   │   ├── campaigns.ts            # Campaign CRUD actions
│   │   ├── sessions.ts             # Session CRUD actions
│   │   └── characters.ts           # Character CRUD actions
│   ├── validations/
│   │   └── schemas.ts              # Zod validation schemas
│   └── utils.ts                    # Helper functions
├── types/                           # TypeScript types
│   └── database.ts                 # Database types
├── supabase/
│   └── migrations/                 # Database migrations
│       ├── 20241017_initial_schema.sql
│       └── 20241017_remove_ability_scores.sql
├── public/                          # Static assets
├── middleware.ts                    # Auth middleware
├── .env.local                       # Environment variables (not committed)
├── .gitignore                       # Git ignore file
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
├── SPEC.md                          # Technical specification
├── IMPLEMENTATION_PLAN.md           # Implementation guide
└── PROJECT_SUMMARY.md               # Project documentation
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
    "next": "15.5.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.49.2",
    "@supabase/ssr": "^0.6.0",
    "@vercel/analytics": "^1.4.1",
    "@vercel/blob": "^2.0.0",
    "typescript": "^5.7.2",
    "tailwindcss": "^3.4.17",
    "zod": "^3.24.1",
    "iron-session": "^8.0.5",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.6",
    "postcss": "^8"
  }
}
```

**Key Points**:

- Uses Vercel Blob Storage (@vercel/blob) for image uploads
- Includes Vercel Analytics (@vercel/analytics) for tracking
- Forms use native HTML with Server Actions (no React Hook Form)

## 10. Development Status

### ✅ Completed

1. ✅ Next.js 15 project with TypeScript and Tailwind CSS
2. ✅ Supabase project setup and connection
3. ✅ Database schema and migrations
4. ✅ Vercel Blob Storage for character images
5. ✅ Password authentication with iron-session
6. ✅ Protected routes via middleware
7. ✅ Home page redirect to dashboard
8. ✅ Image upload functionality with preview and remove
9. ✅ Campaign CRUD (create, read, update, delete)
10. ✅ Session CRUD with character selection
11. ✅ Character CRUD with image upload
12. ✅ Session-character relationships
13. ✅ Dashboard with statistics and recent sessions
14. ✅ Cyberpunk-themed UI with neon styling
15. ✅ Responsive design for mobile/tablet/desktop
16. ✅ Proper Server/Client Component separation
17. ✅ Delete confirmation dialogs as Client Components
18. ✅ Ability scores removed from characters
19. ✅ Vercel Analytics integration for tracking

### 🚧 Known Limitations

- No rich text editor for notes (plain text only)
- No search or filtering functionality
- No export/import features
- No image optimization or resizing
- No dark mode toggle (always dark theme)
- Sessions don't have header images

### 🔮 Future Enhancements (Optional)

1. Rich text editor for session notes
2. Search and filter across all entities
3. Image optimization and automatic resizing via Vercel Blob
4. Export campaigns/sessions to PDF or JSON
5. Drag and drop for reordering
6. Session templates
7. Character stat tracking (if needed)
8. Real-time collaboration with Supabase Realtime
