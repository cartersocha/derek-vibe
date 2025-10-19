# D&D Campaign Manager - Technical Specification

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
│   ├── characters/
│   │   ├── layout.tsx                # Characters layout
│   │   ├── page.tsx                  # Characters list
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Character detail
│   │   │   └── edit/
│   │   │       └── page.tsx          # Edit character
│   │   └── new/
│   │       └── page.tsx              # New character
│   └── organizations/
│       ├── layout.tsx                # Organizations layout
│       ├── page.tsx                  # Organizations list
│       ├── [id]/
│       │   ├── page.tsx              # Organization detail
│       │   └── edit/
│       │       └── page.tsx          # Edit organization
│       └── new/
│           └── page.tsx              # New organization
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
│   ├── organizations/               # Organization-specific UI
│   │   ├── organization-form.tsx    # Organization create/edit form
│   │   └── affiliation-chips.tsx    # Organization affiliation chips
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
│   │   ├── characters.ts           # Character CRUD actions
│   │   └── organizations.ts        # Organization CRUD actions
│   ├── validations/
│   │   ├── schemas.ts              # Zod validation schemas
│   │   └── organization.ts         # Organization-specific schema
│   └── utils.ts                    # Helper functions
├── types/                           # TypeScript types
│   └── database.ts                 # Database types
├── supabase/
│   └── migrations/                 # Database migrations
│       ├── 20241017_initial_schema.sql
│       ├── 20241017_remove_ability_scores.sql
│       ├── 20241018_add_character_player_type_location.sql
│       ├── 20241018_add_character_status.sql
│       ├── 20241018_change_character_level_to_text.sql
│       └── 20241020_add_organizations.sql
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

- No Row Level Security (RLS) needed - basic password protection handles all access
- Cascade deletes: Deleting a campaign deletes sessions, deleting sessions removes session_characters entries

## 3. Application Structure

### Pages & Routes (App Router)

```typescript
app/
├── globals.css                       # Tailwind imports and custom styles
├── layout.tsx                        # Root layout with providers and analytics
├── page.tsx                          # Landing page (redirects to dashboard)
├── login/
│   └── page.tsx                      # Password login page
├── dashboard/
│   ├── layout.tsx                    # Dashboard layout with metrics grid
│   └── page.tsx                      # Dashboard with stats and recent sessions
├── campaigns/
│   ├── layout.tsx                    # Campaigns layout scoped to organization
│   ├── page.tsx                      # Campaigns list filtered by organization
│   ├── [id]/
│   │   ├── page.tsx                  # Campaign detail view
│   │   └── edit/
│   │       └── page.tsx              # Edit campaign
│   └── new/
│       └── page.tsx                  # New campaign form
├── sessions/
│   ├── layout.tsx                    # Sessions layout scoped to organization
│   ├── page.tsx                      # Sessions list with filtering
│   ├── [id]/
│   │   ├── page.tsx                  # Session detail view
│   │   └── edit/
│   │       └── page.tsx              # Edit session
│   └── new/
│       └── page.tsx                  # New session form
├── characters/
│   ├── layout.tsx                    # Characters layout scoped to organization
│   ├── page.tsx                      # Characters list with search
│   ├── [id]/
│   │   ├── page.tsx                  # Character detail view
│   │   └── edit/
│   │       └── page.tsx              # Edit character
│   └── new/
│       └── page.tsx                  # New character form
└── organizations/
  ├── layout.tsx                    # Organizations layout with synthwave sidebar
  ├── page.tsx                      # Organizations list page
  ├── [id]/
  │   ├── page.tsx                  # Organization overview with linked campaigns, sessions, and characters
  │   └── edit/
  │       └── page.tsx              # Edit organization details
  └── new/
    └── page.tsx                  # Create organization flow
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
  - Client component with search, hidden selection syncing, redirect-aware character creation, and inline `@` mention menus that surface character matches at the caret while supporting keyboard navigation and inline character creation when no match exists
- `OrganizationForm` - Create/edit organization with sanitized description, optional logo, and mention-enabled notes
  - Location: `components/organizations/organization-form.tsx`
  - Client component that reuses `MentionableTextarea`, supports logo preview uploads, and forwards organization context IDs into affiliation actions

#### UI Components

- `AutoResizeTextarea` - Textarea that grows with content for long-form inputs using animation frame throttling
  - Location: `components/ui/auto-resize-textarea.tsx`
  - Client component shared by character and session forms for backstory and notes
- `SynthwaveDropdown` - Popover-driven select that powers all fixed-option dropdowns with synthwave styling and optional search/footers
  - Location: `components/ui/synthwave-dropdown.tsx`
  - Client component adopted by character and session forms, supports inline creation footers for workflows like campaign creation
- `CharacterSearch` - Characters index wrapper with inline search and responsive card grid
  - Location: `components/ui/character-search.tsx`
  - Client component providing compact search input, empty-state messaging, and a five-column responsive layout for character cards
- `ImageUpload` - File upload with preview and remove functionality
  - Location: `components/ui/image-upload.tsx`
  - Client component with drag-and-drop support
  - Preview current image and new uploads
  - Remove image functionality
- `Mention Utils` - Shared helpers for rendering and parsing character mentions
  - Location: `lib/mention-utils.tsx`
  - Exports render helpers, boundary checks, and mention target types reused by session detail pages, organization summaries, and list rollups for characters, sessions, organizations, and NPC/player chips
- `DeleteCharacterButton` - Confirmation dialog for character deletion
  - Location: `components/ui/delete-character-button.tsx`
  - Client component with confirmation prompt
- `DeleteSessionButton` - Confirmation dialog for session deletion
  - Location: `components/ui/delete-session-button.tsx`
  - Client component with confirmation prompt
- `DeleteCampaignButton` - Confirmation dialog for campaign deletion
  - Location: `components/ui/delete-campaign-button.tsx`
  - Client component with confirmation prompt
- `AffiliationChips` - Reusable chip renderer that displays organization-linked entities with NPC/player role tinting
  - Location: `components/organizations/affiliation-chips.tsx`
  - Client component shared across organization pages, dashboards, and campaign detail views
- `SessionParticipantPills` - Shared attendee and organization pill renderer with consistent ordering and focus states
  - Location: `components/ui/session-participant-pills.tsx`
  - Server-safe component reused by sessions index, campaign detail, character detail, and dashboard cards to deduplicate rendering logic, keep layouts responsive on mobile, and avoid overflow truncation

## 5. Features & Functionality

### Authentication (Basic Password Protection)

- Single password for app access (stored in environment variable: `APP_PASSWORD`)
- Session-based authentication using iron-session
- Cookie-based session management with encryption
- Protected routes via Next.js middleware
- Logout endpoint remains available for manual use, but the UI omits a logout control per UX guidance
- No user accounts or registration needed
- Session persists across browser sessions

### Organizations

- Create, read, update, and delete organizations that act as the thematic container for campaigns, sessions, and characters
- Organization descriptions leverage the mentionable textarea so staff can reference sessions and characters inline while drafting notes; optional logos provide quick visual anchors
- Link campaigns and sessions to multiple organizations through affiliation join tables without duplicating underlying records
- Associate characters with organizations while denoting whether they appear as `player` or `npc`; chips inherit the role tint whenever rendered under an organization scope
- Organization context threads through server actions so downstream mutations enforce affiliation constraints and sanitize text inputs consistently with other entities
- Switching organizations re-runs dashboard, campaign, session, and character queries using the join tables to keep multi-organization setups isolated

### Campaigns

- Create, read, update, delete campaigns
- Associate campaigns with one or more organizations via the `organization_campaigns` join table; UI lets users toggle organization affiliations without duplicating campaign data
- List all campaigns with session count, filtered by the active organization when one is selected
- View campaign details with associated sessions and any organizations they belong to
- Optional campaign assignment (sessions can exist without campaigns) still applies; affiliation records update automatically when linking or unlinking sessions and campaigns inside an organization
- Campaigns display:
  - Name and description
  - Total sessions count
  - Created and last updated dates
  - List of all sessions in campaign
  - Organization chips summarizing linked groups

### Sessions

- Create, read, update, delete sessions
- Assign to campaign (optional) while preserving organization linkage for standalone sessions via direct `organization_sessions` affiliations
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
  - Player and organization pills reuse the shared renderer so ordering (players before organizations), focus states, and mobile wrapping stay consistent across dashboard, campaigns, and character detail pages without overflow truncation
- Campaign-specific ordering assigns a session number based on ascending session date; numbering appears on the sessions list, campaign detail cards, and session detail header when a campaign provides dated entries
- Unsaved session note drafts persist locally across navigation and are cleared after a successful submission to prevent data loss
- Session notes support inline `@Character` mentions that hyperlink to character sheets; the mention menu appears at the caret, filters matches by name, and offers inline character creation when no match exists (automatically linking the newly created character to the session)
- Mention hyperlinks and dropdown badges are color-coded by target type (character, session, or organization) to keep references scannable in both drafting and rendered views
- Mentioned characters are auto-selected for the session’s attendee list to keep relationships in sync
- Session names are normalized to title case when saved so campaign and dashboard views stay consistent even if inputs vary
- Sessions linked to campaigns automatically sync their organization affiliations, while standalone sessions can be attached directly to organizations for dashboard filtering

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
- Characters can also be created on-the-fly from session notes mentions; the inline creation path captures only the required name and routes the user back to their in-progress draft with the new character linked
- Character backstory editors reuse the caret-anchored mention dropdown (including inline character creation) so relationships stay in sync while drafting, and saved names are normalized to title case for consistent display across the app
- Characters can be affiliated with organizations while marking their role (`npc` vs `player`) for that context; dashboards and character lists tint chips accordingly

### Image Management

- Upload images for characters (portraits) and sessions (header images)
- Image preview before upload with drag-and-drop support and automatic blob URL cleanup
- Store images in Vercel Blob Storage (`character-images`, `session-images`, and `organization-logos`) with public CDN access
- Delete or replace prior uploads when updating/removing assets to avoid orphaned blobs
- Supported formats: JPG, PNG, WebP, GIF
- Max file size: 5MB
- Images served via Vercel's global CDN for fast delivery

### Dashboard

- Overview statistics:
  - Total campaigns count
  - Total sessions count
  - Total characters count
- Recent activity:
  - Up to 6 most recent sessions with campaign-aware session numbers, scheduled dates, and shared attendee/organization pills for quick scanning without the previous note preview block

### Data Integrity & Validation

- Create and update actions for characters, campaigns, sessions, and organizations call `assertUniqueValue` (see `lib/supabase/ensure-unique.ts`) to block case-insensitive duplicates before writes. Database-level unique indexes remain recommended for defense in depth.
- Cyberpunk-themed UI with neon accents
- Switching organizations revalidates dashboard metrics and recent sessions so stats always reflect the active tenant without leaking cross-organization data

## 6. Technical Implementation Details

### State Management

- React Server Components for data fetching (default)
- Client Components marked with 'use client' for interactivity
- Server Actions for all mutations (create, update, delete)
- Form submissions use Server Actions
- No client-side state management library needed
- Client-visible form inputs are sanitized server-side with `sanitize-html` before validation or persistence
- Long-form textareas (session notes, campaign descriptions, and character backstories) enable browser spellcheck to catch typos during drafting
- Organization forms reuse the same sanitization helpers so descriptions and member notes stay free of unsafe markup while still supporting color-coded mention links

### Data Fetching

- Server Components fetch data directly from Supabase using createClient()
- Server Actions for mutations (create, update, delete)
- revalidatePath() for cache invalidation after mutations
- redirect() for navigation after successful mutations
- No client-side data fetching libraries needed
- Active organization IDs come from the protected layout and feed Supabase queries that join against `organization_campaigns`, `organization_sessions`, and `organization_characters` so cross-tenant data stays isolated

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

> **Note (2025-10-19):** Delivered caret-anchored session mention menus with inline character creation, cross-page mention rendering utilities, and streamlined session header image controls.

> **Note (2025-10-19, later):** Brought the character backstory mention dropdown up to the session experience (caret anchoring, inline creation, widened menu), normalized saved session and character names to title case, and enabled browser spellcheck for all long-form editors.

> **Note (2025-10-20):** Consolidated session draft autosave timers into a shared idle-aware scheduler to reduce overlapping timeouts and tightened draft cleanup while continuing the mobile/performance sweep.

> **Note (2025-10-20, evening):** Tinted mention hyperlinks and drafting dropdown badges so character and session references stay color-coded everywhere they render.

> **Note (2025-10-20, late night):** Centralized attendee pill rendering into `SessionParticipantPills`, ensuring consistent ordering, focus states, and mobile wrapping across dashboard, campaign, session, and character views while trimming the dashboard recent session cards by removing the inline note preview block.

> **Note (2025-10-21):** Hooked the application-level uniqueness guard (`assertUniqueValue`) into all entity actions to prevent case-insensitive duplicates and expanded mention tinting to include organizations alongside characters and sessions.


### Form Handling

- Native HTML forms with Server Actions
- Zod for validation schemas (lib/validations/schemas.ts)
- FormData API for form submissions
- Error handling via try/catch in Server Actions
- Client-side validation with HTML5 attributes
- File uploads handled through FormData
- Session notes auto-save to `localStorage` via a shared idle-aware scheduler that debounces updates, tracks all draft keys centrally, and clears cached data after successful submissions
- Autosaved drafts are purged if the user leaves the form without submitting to avoid stale resumes
- Auto-resizing textarea component keeps long-form inputs visible without manual resizing
- Text inputs automatically capitalize their first alphabetical character on blur via a global provider, with an opt-out flag for edge cases

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
│   ├── organizations/               # Organization-specific UI
│   │   ├── organization-form.tsx    # Organization create/edit form
│   │   └── member-chips.tsx         # Member roster chips shared across views
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
│   │   ├── characters.ts           # Character CRUD actions
│   │   └── organizations.ts        # Organization CRUD actions
│   ├── validations/
│   │   ├── schemas.ts              # Zod validation schemas
│   │   └── organization.ts         # Organization-specific schema
│   └── utils.ts                    # Helper functions
├── types/                           # TypeScript types
│   └── database.ts                 # Database types
├── supabase/
│   └── migrations/                 # Database migrations
│       ├── 20241017_initial_schema.sql
│       ├── 20241017_remove_ability_scores.sql
│       ├── 20241018_add_character_player_type_location.sql
│       ├── 20241018_add_character_status.sql
│       ├── 20241018_change_character_level_to_text.sql
│       └── 20241020_add_organizations.sql
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
- Organization affiliations do not yet drive user-level permissions (read/write is uniform)

### 🔮 Future Enhancements (Optional)

1. Rich text editor for session notes
2. Search and filter across all entities
3. Image optimization and automatic resizing via Vercel Blob
4. Export campaigns/sessions to PDF or JSON
5. Drag and drop for reordering
6. Session templates
7. Character stat tracking (if needed)
8. Real-time collaboration with Supabase Realtime
