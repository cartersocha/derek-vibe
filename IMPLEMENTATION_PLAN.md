# D&D Campaign Manager - Implementation Plan

## Current Status: ✅ COMPLETED

This document outlines the implementation plan for the D&D Campaign Manager application. All core features have been successfully implemented.

---

> **Note (2025-10-17):** Completed a mobile responsiveness pass that adds a collapsible mobile navigation, stacks action bars on small screens, and widens primary controls for better touch targets.

> **Note (2025-10-18):** Implemented a performance-focused sidebar overhaul, session form draft auto-save with auto-resizing text areas, redirect-aware character creation, defaulted session dates, and refreshed character metadata presentation.

<!-- markdownlint-disable MD022 MD031 MD032 MD034 MD040 -->

## Recent Enhancements (2025-10-18)

- Collapsible sidebar now supports drag-to-resize with debounced pointer handling, persisted widths, icon-only hover tooltips, and smoother mobile transitions.
- Session create/edit flow introduces localStorage-backed notes drafts, auto-growing text areas, default session dates, and character search with hidden selection syncing.
- Character creation redirects return users to the in-progress session with the new character automatically selected, accelerating party management.
- Backstory and session notes layouts preserve whitespace, while character metadata in selection lists uses a `•` separator for quicker scanning.

## Project Overview

**Framework**: Next.js 15.5.6 (App Router)  
**Language**: TypeScript  
**Styling**: Tailwind CSS (Cyberpunk theme)  
**Database**: Supabase (PostgreSQL)  
**Storage**: Vercel Blob Storage (for images)  
**Analytics**: Vercel Analytics  
**Authentication**: iron-session (password-based)

---

## ✅ Completed Implementation

### Phase 1: Project Setup & Foundation (COMPLETED)

#### Step 1.1: Initialize Next.js Project ✅
- Created Next.js 15.5.6 project with TypeScript, Tailwind, App Router
- Configured project structure
- Set up custom cyberpunk theme with neon colors

#### Step 1.2: Install Core Dependencies ✅
**Installed packages**:
```bash
@supabase/supabase-js @supabase/ssr
@vercel/blob
@vercel/analytics
iron-session
zod
clsx
```
**Note**: React Hook Form was NOT used - forms use native HTML with Server Actions

#### Step 1.3: Environment Configuration ✅
Environment variables configured:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BLOB_READ_WRITE_TOKEN=
APP_PASSWORD=
SESSION_SECRET=
```

#### Step 1.4: Setup Supabase Project ✅
- Created Supabase project
- Configured database connection
- Set up environment variables
- Create `.env.example` for documentation
- Add `.env.local` to `.gitignore` (should already be there)
- Document required environment variables

**Files Created**:
- `.env.local` (not committed)
- `.env.example` (committed as template)

**Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_PASSWORD=your_app_password
SESSION_SECRET=your_32_character_random_string
```

---

### Step 1.4: Setup Supabase Project
**Goal**: Create and configure Supabase backend

**Tasks**:
- Create new Supabase project at https://supabase.com
- Copy project URL and anon key to `.env.local`
- Note service role key for server-side operations
- Verify connection from Next.js app

**Manual Steps** (performed in Supabase Dashboard):
- Create new project
- Wait for project provisioning
- Copy credentials

---

### Step 1.5: Create Database Schema
**Goal**: Set up all database tables and relationships

**Tasks**:
- Create SQL migration file for database schema
- Create `campaigns` table
- Create `sessions` table with FK to campaigns
- Create `characters` table
- Create `session_characters` junction table
- Add indexes for foreign keys
- Set up cascade delete rules
- Run migration in Supabase

**Files Created**:
- `supabase/migrations/20241017_initial_schema.sql`

**SQL to Execute**:
```sql
-- Create campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
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

-- Create characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  race TEXT,
  class TEXT,
  level INTEGER,
  backstory TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session_characters junction table
CREATE TABLE session_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, character_id)
);

-- Create indexes
CREATE INDEX idx_sessions_campaign_id ON sessions(campaign_id);
CREATE INDEX idx_session_characters_session_id ON session_characters(session_id);
CREATE INDEX idx_session_characters_character_id ON session_characters(character_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

#### Step 1.5: Setup Vercel Blob Storage ✅
**Completed**: Using Vercel Blob Storage for image uploads
- Installed `@vercel/blob` package
- Configured `BLOB_READ_WRITE_TOKEN` environment variable
- Images stored with public CDN access
- Automatic file naming: `character-images/characters/{id}/{filename}`
- Max file size: 5MB
- Supported formats: JPG, PNG, WebP, GIF

**Note**: Vercel Blob Storage is used instead of Supabase Storage for better integration with Vercel deployments and global CDN delivery.

---

#### Step 1.7: Setup Analytics & Routing ✅
**Completed**: Integrated Vercel Analytics and configured routing
- Installed `@vercel/analytics` package
- Added Analytics component to root layout
- Configured home page (`/`) to redirect to `/dashboard`
- Middleware protects routes and redirects unauthenticated users to `/login`
- Authenticated users redirected from `/login` to `/dashboard`

**Files Modified**:
- `app/layout.tsx` - Added Analytics component
- `app/page.tsx` - Added redirect to dashboard
- `middleware.ts` - Handles authentication and route protection

---

#### Step 1.8: Create TypeScript Types ✅
**Completed**: Defined all core TypeScript interfaces
- Define database types
- Define form types
- Export all types from index

**Files Created**:
- `types/database.ts`
- `types/index.ts`

**Content**:
```typescript
// types/database.ts
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  campaign_id: string | null;
  name: string;
  session_date: string | null;
  notes: string | null;
  header_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  name: string;
  race: string | null;
  class: string | null;
  level: number | null;
  backstory: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionCharacter {
  id: string;
  session_id: string;
  character_id: string;
  created_at: string;
}

// Extended types with relationships
export interface SessionWithRelations extends Session {
  campaign?: Campaign;
  characters?: Character[];
}

export interface CharacterWithSessions extends Character {
  sessions?: Session[];
}
```

---

### Step 1.8: Setup Supabase Clients
**Goal**: Create Supabase client instances for client and server

**Tasks**:
- Create lib/supabase directory
- Create client-side Supabase client
- Create server-side Supabase client
- Create storage utilities for image uploads

**Files Created**:
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/storage.ts`

---

### Step 1.9: Implement Authentication System
**Goal**: Create basic password authentication with sessions

**Tasks**:
- Create session configuration with iron-session
- Create auth utilities (login, logout, getSession)
- Create middleware to protect routes
- Create login page
- Test authentication flow

**Files Created**:
- `lib/auth/session.ts`
- `lib/auth/config.ts`
- `middleware.ts` (root level)
- `app/login/page.tsx`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`

---

### Step 1.10: Create Base Layout & Navigation
**Goal**: Build the main application layout with navigation

**Tasks**:
- Create root layout with auth check
- Create dashboard layout for protected routes
- Build responsive sidebar navigation in `Navbar` with mobile menu support
- Implement drag-to-resize handling with persisted widths and collapse toggle
- Surface authenticated navigation links while omitting a visible logout control per UX direction
- Style with Tailwind CSS

**Files Created**:
- `app/(protected)/layout.tsx`
- `components/layout/navbar.tsx`

---

## Phase 2: Core CRUD Features

### Step 2.1: Setup Base UI Components
**Goal**: Create reusable UI components for forms and display

**Tasks**:
- Create Button component
- Create Input component
- Create Textarea component
- Create Card component
- Create Select component
- Create Label component
- Configure component variants with Tailwind

> **Enhancement (2025-10-18):** Added `components/ui/auto-resize-textarea.tsx` to auto-grow long-form inputs for session notes and character backstories.

**Files Created**:
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/auto-resize-textarea.tsx`
- `components/ui/card.tsx`
- `components/ui/select.tsx`
- `components/ui/label.tsx`
- `lib/utils.ts` (cn helper function)

---

### Step 2.2: Create Image Upload Components
**Goal**: Build reusable image upload and display functionality

**Tasks**:
- Create ImageUpload component with preview
- Create ImageDisplay component with fallback
- Implement file validation (size, type)
- Add upload progress indicator
- Create upload utilities in storage.ts
- Handle image deletion when replacing

**Files Created**:
- `components/ui/image-upload.tsx`
- `components/ui/image-display.tsx`
- Complete `lib/supabase/storage.ts`

---

### Step 2.3: Create Validation Schemas
**Goal**: Define Zod schemas for all forms

**Tasks**:
- Create campaign validation schema
- Create session validation schema
- Create character validation schema
- Export all schemas

**Files Created**:
- `lib/validations/campaign.ts`
- `lib/validations/session.ts`
- `lib/validations/character.ts`
- `lib/validations/index.ts`

---

### Step 2.4: Build Campaign CRUD
**Goal**: Complete campaign management functionality

**Tasks**:
- Create campaigns list page
- Create campaign card component
- Create campaign form component
- Create new campaign page
- Create campaign detail/edit page
- Create server actions for CRUD operations
- Add error handling and success messages

**Files Created**:
- `app/(protected)/campaigns/page.tsx`
- `app/(protected)/campaigns/new/page.tsx`
- `app/(protected)/campaigns/[id]/page.tsx`
- `components/campaigns/campaign-card.tsx`
- `components/campaigns/campaign-form.tsx`
- `app/(protected)/campaigns/actions.ts`

---

### Step 2.5: Build Session CRUD (Part 1 - Basic)
**Goal**: Create session management without character relationships

**Tasks**:
- Create sessions list page
- Create session card component
- Create session form component (without character selector)
- Create new session page
- Create session detail/edit page
- Add header image upload to form
- Create server actions for CRUD operations
- Add campaign selection dropdown

> **Enhancement (2025-10-18):** Session detail view now presents notes within a neon-styled panel that preserves whitespace for easier reading.

**Files Created**:
- `app/(protected)/sessions/page.tsx`
- `app/(protected)/sessions/new/page.tsx`
- `app/(protected)/sessions/[id]/page.tsx`
- `components/sessions/session-card.tsx`
- `components/sessions/session-form.tsx`
- `app/(protected)/sessions/actions.ts`

---

### Step 2.6: Build Character CRUD
**Goal**: Complete character management functionality

**Tasks**:
- Create characters list page
- Create character card component
- Create character form component with all attributes
- Add character image upload to form
- Create new character page
- Create character detail/edit page
- Create server actions for CRUD operations
- Add character attribute inputs (STR, DEX, CON, INT, WIS, CHA)

> **Enhancement (2025-10-18):** Character detail layout now highlights Backstory & Notes with preserved line breaks, and selection lists render race/class metadata with a separator dot for readability.

**Files Created**:
- `app/(protected)/characters/page.tsx`
- `app/(protected)/characters/new/page.tsx`
- `app/(protected)/characters/[id]/page.tsx`
- `components/characters/character-card.tsx`
- `components/characters/character-form.tsx`
- `components/characters/character-stats.tsx`
- `app/(protected)/characters/actions.ts`

---

### Step 2.7: Build Session CRUD (Part 2 - Character Relationships)
**Goal**: Add character attachment functionality to sessions

**Tasks**:
- Create CharacterSelector component (multi-select)
- Update session form to include character selection
- Create server actions to manage session_characters
- Display attached characters on session detail page
- Add ability to add/remove characters from existing session
- Create session list component for character detail page

> **Enhancement (2025-10-18):** Session form now auto-saves notes drafts to `localStorage`, defaults new session dates to today, exposes a character search with hidden selection syncing, and integrates redirect-aware character creation so new characters return preselected.

**Files Created/Modified**:
- `components/sessions/character-selector.tsx`
- `components/characters/session-list.tsx`
- Update `components/sessions/session-form.tsx`
- Update `app/(protected)/sessions/[id]/page.tsx`
- Update `app/(protected)/characters/[id]/page.tsx`
- Update `app/(protected)/sessions/actions.ts`

---

### Step 2.8: Enhance Character Detail Page
**Goal**: Show session participation on character pages

**Tasks**:
- Fetch sessions for specific character
- Display session list with links
- Show session dates and campaigns
- Add visual indicator for recent sessions

**Files Modified**:
- Update `app/(protected)/characters/[id]/page.tsx`
- Use `components/characters/session-list.tsx`

---

## Phase 3: Dashboard & Polish

### Step 3.1: Build Dashboard Page
**Goal**: Create overview dashboard with statistics

**Tasks**:
- Create dashboard page layout
- Fetch and display statistics (counts)
- Show 3 most recent sessions
- Add quick action buttons
- Create stat card component
- Link recent sessions to detail pages

**Files Created**:
- `app/(protected)/dashboard/page.tsx`
- `components/dashboard/stat-card.tsx`
- `components/dashboard/recent-sessions.tsx`
- `components/dashboard/quick-actions.tsx`

---

### Step 3.2: Add Loading States
**Goal**: Improve UX with loading indicators

**Tasks**:
- Create loading.tsx files for each route
- Add Spinner component
- Add skeleton loaders for cards
- Add loading states to forms (disabled buttons)
- Handle async operations gracefully

**Files Created**:
- `components/ui/spinner.tsx`
- `components/ui/skeleton.tsx`
- `app/(protected)/dashboard/loading.tsx`
- `app/(protected)/campaigns/loading.tsx`
- `app/(protected)/sessions/loading.tsx`
- `app/(protected)/characters/loading.tsx`

---

### Step 3.3: Add Error Handling
**Goal**: Implement comprehensive error handling

**Tasks**:
- Create error.tsx boundary files
- Add toast notification system
- Handle form validation errors
- Handle API/database errors
- Add error messages to UI
- Create error display component

**Files Created**:
- `components/ui/toast.tsx`
- `components/ui/error-message.tsx`
- `app/(protected)/error.tsx`
- `lib/utils/error-handler.ts`

---

### Step 3.4: Improve Responsive Design
**Goal**: Ensure mobile-friendly layouts

**Tasks**:
- Test all pages on mobile viewport
- Adjust grid layouts for mobile
- Make navigation responsive (hamburger menu)
- Ensure forms work well on mobile
- Test image uploads on mobile
- Adjust card layouts for small screens

**Files Modified**:
- Update all layout components
- Update all page components
- Update navigation components

---

### Step 3.5: Add Filtering and Search
**Goal**: Allow users to filter and search data

**Tasks**:
- Add search input to campaigns list
- Add search input to characters list
- Add campaign filter to sessions list
- Implement client-side filtering
- Add clear filters button

**Files Modified**:
- Update `app/(protected)/campaigns/page.tsx`
- Update `app/(protected)/sessions/page.tsx`
- Update `app/(protected)/characters/page.tsx`
- Create `components/ui/search-input.tsx`

---

### Step 3.6: Polish UI/UX
**Goal**: Refine overall look and feel

**Tasks**:
- Improve color scheme and consistency
- Add hover states to interactive elements
- Improve form layouts and spacing
- Add icons (lucide-react)
- Improve typography hierarchy
- Add transitions and animations
- Review and improve accessibility

**Tasks**:
- Install lucide-react icons
- Update component styling
- Add ARIA labels where needed

---

### Step 3.7: Add Confirmation Dialogs
**Goal**: Prevent accidental deletions

**Tasks**:
- Create Dialog/Modal component
- Add delete confirmation for campaigns
- Add delete confirmation for sessions
- Add delete confirmation for characters
- Handle cascade delete warnings

**Files Created**:
- `components/ui/dialog.tsx`
- `components/ui/alert-dialog.tsx`

---

### Step 3.8: Create Landing Page
**Goal**: Build public homepage

**Tasks**:
- Design landing page layout
- Add app description and features
- Add login button
- Style with Tailwind CSS
- Make responsive

**Files Modified**:
- Update `app/page.tsx`

---

## Phase 4: Testing & Deployment Prep

### Step 4.1: Manual Testing
**Goal**: Test all functionality end-to-end

**Tasks**:
- Test authentication flow
- Test campaign CRUD operations
- Test session CRUD operations
- Test character CRUD operations
- Test session-character relationships
- Test image uploads (characters and sessions)
- Test image deletion/replacement
- Test filtering and search
- Test responsive design on multiple devices
- Test error scenarios
- Test edge cases (empty states, long text, etc.)

---

### Step 4.2: Code Cleanup
**Goal**: Remove unused code and improve quality

**Tasks**:
- Remove console.logs
- Remove commented-out code
- Remove unused imports
- Format all files consistently
- Run TypeScript check
---

## Summary

### ✅ All Core Features Implemented

**Completed Features**:
1. ✅ Full authentication system with iron-session
2. ✅ Campaign CRUD operations
3. ✅ Session CRUD operations with character linking
4. ✅ Character CRUD operations with image uploads
5. ✅ Supabase Storage integration for character images
6. ✅ Dashboard with statistics and recent sessions
7. ✅ Responsive cyberpunk-themed UI
8. ✅ Proper Server/Client Component architecture
9. ✅ Protected routes via middleware
10. ✅ Delete confirmation dialogs for all entities
11. ✅ Ability scores removed from character system

### 📁 Current File Structure

```
dnd-manager/
├── app/
│   ├── campaigns/[id]/(page.tsx, edit/page.tsx)
│   ├── sessions/[id]/(page.tsx, edit/page.tsx)
│   ├── characters/[id]/(page.tsx, edit/page.tsx)
│   ├── dashboard/
│   └── login/
├── components/
│   ├── ui/(image-upload, delete buttons)
│   ├── forms/(character-edit-form, session-form)
│   └── layout/navbar.tsx
├── lib/
│   ├── actions/(campaigns, sessions, characters)
│   ├── auth/(session, actions)
│   ├── supabase/(client, server, storage)
│   └── validations/schemas.ts
├── types/database.ts
├── supabase/migrations/
└── middleware.ts
```

### 🚀 Deployment Ready

The application is production-ready and can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any platform supporting Next.js

### 📝 Configuration Required

Before deployment, ensure these environment variables are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
APP_PASSWORD=
SESSION_SECRET=
```

### 🎯 Testing Status

- ✅ Authentication flow tested
- ✅ All CRUD operations verified
- ✅ Image upload/delete functionality working
- ✅ Responsive design on mobile/tablet/desktop
- ✅ Server Actions working correctly
- ✅ Delete confirmations functioning

---

## Development Complete

This implementation successfully delivers a fully functional D&D Campaign Manager with all planned core features. The application follows Next.js 15 best practices with proper Server/Client Component separation and uses modern patterns like Server Actions for data mutations.

<!-- markdownlint-enable MD022 MD031 MD032 MD034 MD040 -->

