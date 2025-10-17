# D&D Campaign Manager - Implementation Plan

This plan breaks down the development into granular, actionable steps that we'll follow sequentially.

---

## Phase 1: Project Setup & Foundation

### Step 1.1: Initialize Next.js Project
**Goal**: Create the base Next.js application with TypeScript and Tailwind CSS

**Tasks**:
- Run `npx create-next-app@latest` with TypeScript, Tailwind, App Router, and src/ directory options
- Verify project structure is correct
- Test that dev server runs successfully
- Clean up default Next.js boilerplate files

**Files Created/Modified**:
- `package.json`
- `next.config.js`
- `tailwind.config.ts`
- `tsconfig.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`

---

### Step 1.2: Install Core Dependencies
**Goal**: Add all required npm packages

**Tasks**:
- Install Supabase packages (`@supabase/supabase-js`, `@supabase/ssr`)
- Install form handling (`react-hook-form`, `@hookform/resolvers`, `zod`)
- Install utility packages (`clsx`, `tailwind-merge`)
- Install session management (`iron-session`)
- Verify all packages install without conflicts

**Command**:
```bash
npm install @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod iron-session clsx tailwind-merge
```

---

### Step 1.3: Environment Configuration
**Goal**: Set up environment variables and configuration files

**Tasks**:
- Create `.env.local` file with placeholder values
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
  strength INTEGER,
  dexterity INTEGER,
  constitution INTEGER,
  intelligence INTEGER,
  wisdom INTEGER,
  charisma INTEGER,
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

### Step 1.6: Setup Supabase Storage Buckets
**Goal**: Create storage buckets for image uploads

**Tasks**:
- Create `character-images` bucket
- Create `session-images` bucket
- Configure public read access for both buckets
- Set file size limits (5MB)
- Restrict to image file types (JPG, PNG, WebP)

**Manual Steps** (in Supabase Dashboard > Storage):
1. Create `character-images` bucket
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp
2. Create `session-images` bucket
   - Same settings as above

---

### Step 1.7: Create TypeScript Types
**Goal**: Define all core TypeScript interfaces and types

**Tasks**:
- Create types directory
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
  strength: number | null;
  dexterity: number | null;
  constitution: number | null;
  intelligence: number | null;
  wisdom: number | null;
  charisma: number | null;
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
- Create Navbar component
- Create Sidebar component
- Add logout functionality
- Style with Tailwind CSS

**Files Created**:
- `app/(protected)/layout.tsx`
- `components/layout/navbar.tsx`
- `components/layout/sidebar.tsx`

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

**Files Created**:
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
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
- Fix any TypeScript errors or warnings

**Commands**:
```bash
npm run build
npx tsc --noEmit
```

---

### Step 4.3: Documentation
**Goal**: Document setup and usage

**Tasks**:
- Create README.md with setup instructions
- Document environment variables
- Document database setup steps
- Document how to run locally
- Document Supabase configuration steps

**Files Created**:
- `README.md`

---

### Step 4.4: Deployment Preparation
**Goal**: Prepare app for deployment

**Tasks**:
- Verify all environment variables are documented
- Test production build locally
- Verify image uploads work with production Supabase
- Check for any hardcoded localhost URLs
- Set up proper error logging

**Commands**:
```bash
npm run build
npm run start
```

---

## Summary of Steps

**Total Steps**: 34 detailed steps across 4 phases

**Phase 1** (Setup): 10 steps - ~2-3 hours
**Phase 2** (CRUD): 8 steps - ~4-5 hours  
**Phase 3** (Polish): 8 steps - ~2-3 hours
**Phase 4** (Testing): 4 steps - ~1-2 hours

**Estimated Total Time**: 9-13 hours of focused development

---

## Next Steps

We'll proceed step-by-step through this plan. Each step will be completed fully before moving to the next. After each major milestone (end of each phase), we'll test the functionality before proceeding.

Ready to begin with **Step 1.1: Initialize Next.js Project**?
