# D&D Campaign Manager - Setup Guide

## Quick Start Checklist

Follow these steps to get your D&D Campaign Manager up and running.

### ✅ Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `dnd-campaign-manager` (or your choice)
   - Database Password: Generate a strong password
   - Region: Choose closest to you
5. Click "Create new project"
6. Wait for project to finish provisioning (~2 minutes)

### ✅ Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhb...`)
   - **service_role** key (starts with `eyJhb...`) - ⚠️ Keep this secret!

### ✅ Step 3: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open the file `supabase/migrations/20241017_initial_schema.sql` in your project
4. Copy all the SQL content
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Verify all tables were created by going to **Table Editor**

You should see 4 tables:
- campaigns
- sessions
- characters
- session_characters

### ✅ Step 4: Create Storage Buckets (Optional - for future image uploads)

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Create first bucket:
   - Name: `character-images`
   - Public: ✅ Yes
   - Click "Create bucket"
4. Create second bucket:
   - Name: `session-images`
   - Public: ✅ Yes
   - Click "Create bucket"

### ✅ Step 5: Configure Environment Variables

1. In your project folder, open `.env.local`
2. Fill in the values:

```env
# From Step 2 - Supabase API Settings
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...your-service-role-key...

# Choose your own password for the app
APP_PASSWORD=your_secure_password_here

# Generate a random 32+ character string for session secret
SESSION_SECRET=your_32_character_random_string
```

**To generate SESSION_SECRET**, run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ✅ Step 6: Install Dependencies & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

### ✅ Step 7: Login

1. Click "Get Started" on the homepage
2. Enter the password you set in `APP_PASSWORD`
3. You should now see the Dashboard!

## Troubleshooting

### "Invalid password" when logging in
- Check that `APP_PASSWORD` in `.env.local` matches what you're typing
- Make sure there are no extra spaces in the `.env.local` file

### "Failed to fetch" or database errors
- Verify your Supabase credentials are correct in `.env.local`
- Check that you ran the SQL migration in Step 3
- Make sure your Supabase project is active (not paused)

### TypeScript or build errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `.next` folders, then run `npm install` again

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

## Next Steps

Once everything is running:

1. **Create a Campaign** - Go to Campaigns → New Campaign
2. **Add Characters** - Go to Characters → New Character
3. **Record Sessions** - Go to Sessions → New Session
4. **Link them together** - Associate sessions with campaigns and characters

## Production Deployment

When ready to deploy:

1. Build the project: `npm run build`
2. Test production build locally: `npm start`
3. Deploy to Vercel, Netlify, or your preferred hosting
4. Set environment variables in your hosting platform
5. Update Supabase settings if needed (like allowed URLs)

## Need Help?

- Check the main [README.md](./README.md) for more details
- Review the [SPEC.md](../SPEC.md) for technical specifications
- Check Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
