# D&D Campaign Manager - Technical Specification

## 1. Project Overview

A full-stack web application for managing D&D campaigns, sessions, characters, and organizations built with Next.js 15, TypeScript, Tailwind CSS, and Supabase. Features a cyberpunk-themed UI with mobile-first responsive design, organization-based multi-tenancy, and advanced mention system with inline creation capabilities.

## 2. Architecture & Technology Stack

### Core Technologies
- **Framework**: Next.js 15.5.6 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17 with custom cyberpunk theme
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Storage**: Vercel Blob Storage for images (CDN delivery)
- **Authentication**: iron-session (password-based)
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel (optimized)

### Key Dependencies
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
    "iron-session": "^8.0.5",
    "zod": "^3.24.1",
    "clsx": "^2.1.1",
    "sanitize-html": "^2.11.0"
  }
}
```

## 3. Application Structure

### File Organization
```typescript
dnd-manager/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout with viewport meta
│   ├── page.tsx                      # Home page (redirects to dashboard)
│   ├── globals.css                   # Global styles with mobile optimizations
│   ├── login/
│   │   └── page.tsx                  # Password authentication
│   ├── dashboard/
│   │   ├── layout.tsx                # Dashboard layout
│   │   └── page.tsx                  # Statistics and recent sessions
│   ├── campaigns/
│   │   ├── layout.tsx                # Campaigns layout
│   │   ├── page.tsx                  # Campaigns list with created date
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Campaign detail
│   │   │   └── edit/
│   │   │       └── page.tsx          # Edit campaign
│   │   └── new/
│   │       └── page.tsx              # New campaign
│   ├── sessions/
│   │   ├── layout.tsx                # Sessions layout
│   │   ├── page.tsx                  # Sessions list with search
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Session detail
│   │   │   └── edit/
│   │   │       └── page.tsx          # Edit session
│   │   └── new/
│   │       └── page.tsx              # New session
│   ├── characters/
│   │   ├── layout.tsx                # Characters layout
│   │   ├── page.tsx                  # Characters list with search
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
│   │   ├── auto-resize-textarea.tsx # Auto-growing textarea
│   │   ├── mentionable-textarea.tsx # Textarea with @ mentions
│   │   ├── entity-multi-select.tsx  # Searchable multi-select
│   │   ├── synthwave-dropdown.tsx   # Themed dropdown component
│   │   ├── creatable-select.tsx     # Select with inline creation
│   │   ├── image-upload.tsx         # Image upload with preview
│   │   ├── character-search.tsx     # Character search component
│   │   ├── campaigns-index.tsx      # Campaign cards with created date
│   │   ├── sessions-index.tsx       # Session cards
│   │   ├── organizations-index.tsx  # Organization cards
│   │   ├── session-participant-pills.tsx # Shared attendee chips
│   │   ├── multi-select-dropdown.tsx # Multi-select with search
│   │   ├── delete-*-button.tsx      # Delete confirmation dialogs
│   │   └── dashboard-session-card.tsx # Dashboard session cards
│   ├── forms/                       # Form components
│   │   ├── campaign-form.tsx        # Campaign create/edit form
│   │   ├── character-edit-form.tsx  # Character edit form
│   │   ├── new-character-form.tsx   # New character form
│   │   ├── session-form.tsx         # Session form with mentions
│   │   └── character-organization-field.tsx # Character org field
│   ├── organizations/               # Organization-specific UI
│   │   └── organization-form.tsx    # Organization create/edit form
│   ├── providers/                   # React providers
│   │   └── auto-capitalize-provider.tsx # Auto-capitalization
│   └── layout/                      # Layout components
│       └── navbar.tsx               # Responsive navigation
├── lib/                             # Utilities and helpers
│   ├── supabase/
│   │   ├── client.ts               # Client-side Supabase client
│   │   ├── server.ts               # Server-side Supabase client
│   │   ├── storage.ts              # Vercel Blob utilities
│   │   └── ensure-unique.ts         # Uniqueness validation
│   ├── auth/
│   │   ├── session.ts              # iron-session configuration
│   │   └── actions.ts              # Auth server actions
│   ├── actions/                    # Server actions
│   │   ├── campaigns.ts            # Campaign CRUD actions
│   │   ├── sessions.ts              # Session CRUD actions
│   │   ├── characters.ts           # Character CRUD actions
│   │   └── organizations.ts        # Organization CRUD actions
│   ├── validations/
│   │   ├── schemas.ts              # Zod validation schemas
│   │   └── organization.ts         # Organization-specific schema
│   ├── characters/
│   │   └── constants.ts           # Character constants
│   ├── organizations/
│   │   └── helpers.ts              # Organization helpers
│   ├── security/
│   │   └── sanitize.ts             # HTML sanitization
│   ├── mention-utils.tsx           # Mention rendering utilities
│   ├── mentions.ts                  # Mention parsing logic
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
│       ├── 20241020_add_organizations.sql
│       └── 20241021_add_campaign_characters.sql
├── public/                          # Static assets
├── middleware.ts                    # Auth middleware
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
├── SPEC.md                          # Technical specification
└── IMPLEMENTATION_PLAN.md           # Implementation guide
```

## 4. Core Features & Functionality

### Authentication System
- **Password-based authentication** using iron-session
- **Session persistence** across browser sessions
- **Protected routes** via Next.js middleware
- **No user accounts** - single password for app access
- **Environment-based configuration** with secure session secrets

### Organization Management (Multi-Tenancy)
- **Create, read, update, delete organizations** that act as thematic containers
- **Organization affiliations** for campaigns, sessions, and characters
- **Role-based character associations** (NPC vs Player) within organizations
- **Organization switching** with isolated data views
- **Logo uploads** with Vercel Blob Storage
- **Mention-enabled descriptions** with cross-entity references

### Campaign Management
- **Full CRUD operations** for campaigns
- **Editable created dates** with date picker
- **Multi-organization affiliations** via join tables
- **Character associations** through campaign_characters table
- **Session linking** with automatic organization sync
- **Campaign-aware session numbering** based on chronological order
- **Created date display** on campaign cards (top-right positioning)

### Session Management
- **Session CRUD** with optional campaign assignment
- **Header image uploads** with Vercel Blob Storage
- **Auto-resizing textarea** for session notes
- **Draft auto-save** via localStorage with idle-aware scheduler
- **Character attendance tracking** with multi-select interface
- **Campaign-aware session numbering** for chronological ordering
- **Mention system** with @Character, @Session, @Organization support
- **Inline character creation** from mention dropdowns
- **Color-coded mention badges** for different entity types

### Character Management
- **Character CRUD** with image uploads
- **Character attributes**: name, race, class, level, backstory, status, location
- **Player type classification** (NPC vs Player)
- **Organization affiliations** with role-based chips
- **Session participation tracking** with attendee lists
- **Mention-enabled backstories** with cross-entity references
- **Auto-capitalization** for character names
- **Title case normalization** for consistent display

### Advanced UI Features

#### Mention System
- **Caret-anchored dropdowns** that appear at cursor position
- **Inline entity creation** when no matches exist
- **Color-coded badges** for different mention types:
  - Characters: Cyan (#00ffff)
  - Sessions: Magenta (#ff00ff)  
  - Organizations: Orange (#ff6b35)
- **Keyboard navigation** with arrow keys and Enter
- **Auto-selection** of mentioned characters for sessions
- **Cross-page mention rendering** with consistent styling

#### Mobile Responsiveness
- **Mobile-first design** with responsive breakpoints
- **Touch-optimized targets** (44px minimum)
- **Sticky navigation** with hamburger menu
- **Responsive grids** (1/3/5 column layouts)
- **Mobile-specific CSS optimizations**:
  - Prevent zoom on input focus (16px font-size)
  - Smooth scrolling with -webkit-overflow-scrolling
  - Tap highlight removal for performance
  - Reduced motion support for accessibility
- **Viewport meta tag** configuration
- **Auto-resizing textareas** for mobile input

#### Navigation & Layout
- **Collapsible sidebar** with drag-to-resize
- **Width persistence** via localStorage
- **Double-click toggle** for quick collapse
- **Auto-clamping** to content width
- **Mobile hamburger menu** with icon navigation
- **Responsive breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

### Data Management

#### Server Actions & State Management
- **Server Components** for data fetching (default)
- **Client Components** marked with 'use client' for interactivity
- **Server Actions** for all mutations (create, update, delete)
- **Form submissions** using native HTML with Server Actions
- **No client-side state management** library needed
- **Cache invalidation** via revalidatePath()
- **Navigation** via redirect() after mutations

#### Data Integrity & Validation
- **Server-side sanitization** using sanitize-html
- **Uniqueness guards** via assertUniqueValue()
- **Database-level unique indexes** for defense in depth
- **Zod validation schemas** for all forms
- **HTML sanitization** for all text inputs
- **Case-insensitive duplicate prevention**

#### Image Management
- **Vercel Blob Storage** for all images
- **CDN delivery** via Vercel's global network
- **Automatic cleanup** of replaced/deleted images
- **Drag-and-drop upload** with preview
- **Supported formats**: JPG, PNG, WebP, GIF
- **Max file size**: 5MB
- **Storage buckets**: character-images, session-images, organization-logos

### Dashboard & Analytics
- **Statistics overview**: campaigns, sessions, characters count
- **Recent sessions** with campaign-aware numbering
- **Attendee chips** with organization affiliations
- **Responsive card layouts** for mobile/desktop
- **Vercel Analytics** integration for usage tracking

## 5. Database Schema

### Core Tables
```sql
-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions  
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_date DATE,
  notes TEXT,
  header_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Characters
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  race TEXT,
  class TEXT,
  level TEXT,
  backstory TEXT,
  image_url TEXT,
  player_type TEXT NOT NULL DEFAULT 'npc' CHECK (player_type IN ('npc', 'player')),
  last_known_location TEXT,
  status TEXT NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'dead', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Join Tables
```sql
-- Session-Character relationships
CREATE TABLE session_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, character_id)
);

-- Campaign-Character relationships
CREATE TABLE campaign_characters (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, character_id)
);

-- Organization affiliations
CREATE TABLE organization_campaigns (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, campaign_id)
);

CREATE TABLE organization_sessions (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, session_id)
);

CREATE TABLE organization_characters (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'npc' CHECK (role IN ('npc', 'player')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, character_id)
);
```

## 6. Styling & Design System

### Cyberpunk Theme
- **Primary Colors**:
  - Cyan: #00ffff (primary actions, character mentions)
  - Magenta: #ff00ff (secondary actions, session mentions)
  - Orange: #ff6b35 (organization mentions, accents)
- **Background**: Dark purple/navy (#0f0f23, #1a1a3e)
- **Typography**: Space Grotesk (headings), Fira Code (monospace)
- **Effects**: Backdrop blur, neon glows, glassmorphism

### Responsive Design
- **Mobile-first approach** with progressive enhancement
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch targets**: 44px minimum for mobile
- **Grid layouts**: 1/3/5 column responsive grids for cards
- **Mobile navigation**: Sticky header with hamburger menu

### CSS Variables & Design System
```css
/* Pill size variables */
--pill-padding-x-small: 0.5rem;  /* px-2 */
--pill-padding-y-small: 0.25rem; /* py-1 */
--pill-padding-x-medium: 0.75rem; /* px-3 */
--pill-padding-y-medium: 0.25rem; /* py-1 */
--pill-padding-x-tiny: 0.5rem;    /* px-2 */
--pill-padding-y-tiny: 0.125rem;  /* py-0.5 */
```

### CSS Optimizations
```css
/* Mobile-specific optimizations */
@media (max-width: 768px) {
  /* Touch targets */
  button, input[type="button"], a[role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Prevent zoom on input focus */
  input, textarea, select {
    font-size: 16px;
  }
  
  /* Smooth scrolling */
  * {
    -webkit-overflow-scrolling: touch;
  }
  
  /* Performance optimizations */
  * {
    -webkit-tap-highlight-color: transparent;
  }
}
```

## 7. Environment Configuration

### Required Environment Variables
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

### Optional Environment Variables
- **Vercel Analytics**: Automatically enabled when deployed to Vercel
- **Development**: Hot reload and TypeScript checking enabled

## 8. Development Status

### ✅ Completed Features

#### Core Functionality
1. ✅ Next.js 15 project with TypeScript and Tailwind CSS
2. ✅ Supabase project setup and connection
3. ✅ Database schema and migrations
4. ✅ Vercel Blob Storage for images
5. ✅ Password authentication with iron-session
6. ✅ Protected routes via middleware
7. ✅ Home page redirect to dashboard

#### Entity Management
8. ✅ Campaign CRUD with created date editing
9. ✅ Session CRUD with character selection and mentions
10. ✅ Character CRUD with image upload and organization affiliations
11. ✅ Organization CRUD with logo uploads and member management
12. ✅ Session-character relationships with attendance tracking
13. ✅ Campaign-character relationships with multi-select
14. ✅ Organization affiliations for all entities

#### Advanced Features
15. ✅ Mention system with caret-anchored dropdowns
16. ✅ Inline entity creation from mention dropdowns
17. ✅ Color-coded mention badges and hyperlinks
18. ✅ Draft auto-save with idle-aware scheduler
19. ✅ Auto-resizing textareas for long-form content
20. ✅ Auto-capitalization for text inputs
21. ✅ Title case normalization for names
22. ✅ Comprehensive input sanitization system
23. ✅ XSS protection for all user inputs
24. ✅ Search input sanitization across all components
25. ✅ Password input sanitization and validation
26. ✅ Mention query sanitization and protection
27. ✅ Server-side HTML sanitization with length limits
28. ✅ Uniqueness validation with database constraints

#### UI/UX Features
29. ✅ Cyberpunk-themed UI with neon styling
30. ✅ Responsive design for mobile/tablet/desktop
31. ✅ Collapsible sidebar with drag-to-resize
32. ✅ Mobile navigation with hamburger menu
33. ✅ Touch-optimized targets and mobile CSS
34. ✅ Dashboard with statistics and recent sessions
35. ✅ Search functionality across all entities
36. ✅ Delete confirmation dialogs
37. ✅ Image upload with preview and cleanup
38. ✅ Campaign cards with created date positioning
39. ✅ Auto-resizing textareas for dynamic content
40. ✅ Creatable select components with custom options
41. ✅ Synthwave dropdown components with cyberpunk styling
42. ✅ Multi-select components with search and filtering
43. ✅ Character search with organization filtering
44. ✅ Session participant pills with consistent styling
45. ✅ Entity multi-select with inline creation
46. ✅ Simple multi-select variants for different use cases
47. ✅ Index utility components for consistent layouts
48. ✅ Dashboard session cards with rich metadata
49. ✅ Campaign session cards with visual hierarchy
50. ✅ Character session cards with organization info
51. ✅ Session manager with comprehensive controls
52. ✅ Character affiliations display with role chips
53. ✅ Organizations index with member management
54. ✅ Sessions index with campaign grouping
55. ✅ Campaigns index with session counts

#### Performance & Optimization
56. ✅ Proper Server/Client Component separation
57. ✅ Server Actions for all mutations
58. ✅ Cache invalidation and revalidation
59. ✅ Mobile-specific CSS optimizations
60. ✅ Image optimization via Vercel CDN
61. ✅ Vercel Analytics integration
62. ✅ Database indexing and query optimization
63. ✅ Form optimization utilities with memoization
64. ✅ Storage bucket management for images
65. ✅ CSS class utilities for consistent styling
66. ✅ Auto-capitalization provider for text inputs
67. ✅ Sidebar provider for state management
68. ✅ Standardized pill size variables for consistent UI components

#### Security Features
68. ✅ Comprehensive input sanitization system
69. ✅ XSS protection for all user inputs
70. ✅ Search input sanitization across all components
71. ✅ Password input sanitization and validation
72. ✅ Mention query sanitization and protection
73. ✅ Server-side HTML sanitization with length limits
74. ✅ Form data utility functions with built-in sanitization
75. ✅ Strict sanitization for sensitive inputs (passwords, search)
76. ✅ Dangerous pattern detection and removal
77. ✅ Input length validation and limits
78. ✅ CSRF protection system with token generation
79. ✅ Mention-specific sanitization for rich content
80. ✅ Search sanitization utilities for filtering operations
81. ✅ Enhanced sanitization options for different content types
82. ✅ Rich text sanitization with allowed formatting tags

### 🚧 Known Limitations
- No rich text editor for notes (plain text only)
- No export/import features
- No image optimization or resizing
- No dark mode toggle (always dark theme)
- Organization affiliations don't drive permissions (uniform access)

### 🔮 Future Enhancements (Optional)
1. Rich text editor for session notes
2. Advanced search and filtering
3. Image optimization and automatic resizing
4. Export campaigns/sessions to PDF or JSON
5. Drag and drop for reordering
6. Session templates
7. Real-time collaboration with Supabase Realtime
8. Advanced analytics and reporting

## 9. Deployment & Production

### Production Ready
The application is production-ready and optimized for deployment to:
- **Vercel** (recommended for Next.js)
- **Netlify** 
- **Any platform supporting Next.js**

### Performance Optimizations
- **Server Components** for optimal data fetching
- **Client Components** only where interactivity is needed
- **Image optimization** via Vercel Blob CDN
- **Mobile-first responsive design**
- **Touch-optimized interactions**
- **Efficient caching** with revalidatePath()

### Security Features
- **Server-side HTML sanitization**
- **Input validation** with Zod schemas
- **Uniqueness constraints** at database level
- **Protected routes** with middleware
- **Secure session management** with iron-session

---

## Summary

The D&D Campaign Manager is a comprehensive, production-ready application featuring:

- **Full CRUD operations** for campaigns, sessions, characters, and organizations
- **Advanced mention system** with inline creation and color-coded references
- **Mobile-first responsive design** with touch optimizations
- **Multi-tenant organization support** with role-based affiliations
- **Draft auto-save** and **auto-resizing textareas** for improved UX
- **Cyberpunk-themed UI** with neon colors and glassmorphism effects
- **Server-side security** with sanitization and validation
- **Vercel Blob Storage** for image management with CDN delivery
- **Comprehensive mobile optimizations** for all screen sizes

The application follows Next.js 15 best practices with proper Server/Client Component separation and uses modern patterns like Server Actions for data mutations. All features are fully implemented, tested, and production-ready.