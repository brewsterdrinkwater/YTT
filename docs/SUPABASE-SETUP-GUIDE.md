# YTT Supabase Setup Guide

Complete step-by-step guide to add authentication and persistent storage to YTT.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Your YTT App                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Login     │  │   Entries   │  │   CSV Export        │  │
│  │   Page      │  │   CRUD      │  │   (taxes, mapping)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Free Tier)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │  PostgreSQL │  │   Row Level         │  │
│  │  (Google,   │  │  Database   │  │   Security          │  │
│  │   Email)    │  │             │  │   (user isolation)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**What you get:**
- User accounts (email/password or Google sign-in)
- All entries saved to cloud database
- Data isolated per user (your 5 users can't see each other's data)
- CSV export with location, mood, activities for taxes/mapping
- Works offline, syncs when online
- Free tier: 500MB database, 50K requests/month (plenty for 5 users)

---

## Phase 1: Create Supabase Project (10 minutes)

### Step 1.1: Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email
4. Click "New Project"

### Step 1.2: Create Your Project

Fill in:
- **Name:** `ytt-diary` (or whatever you prefer)
- **Database Password:** Generate a strong one and SAVE IT somewhere safe
- **Region:** Choose closest to you (e.g., `us-east-1` for East Coast US)
- **Plan:** Free tier is fine

Click "Create new project" - takes ~2 minutes to provision.

### Step 1.3: Get Your API Keys

Once created, go to **Settings → API** and copy:

```
Project URL:     https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

You'll need these in Step 2.

---

## Phase 2: Set Up Database Schema (15 minutes)

### Step 2.1: Open SQL Editor

In your Supabase dashboard:
1. Click **SQL Editor** in the left sidebar
2. Click **New query**

### Step 2.2: Create Tables

Paste this SQL and click **Run**:

```sql
-- =============================================
-- YTT Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENTRIES TABLE (Main data)
-- =============================================
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields
  date DATE NOT NULL,
  location TEXT NOT NULL,
  other_location_name TEXT,
  trip_type TEXT CHECK (trip_type IN ('business', 'pleasure')),
  feeling INTEGER NOT NULL CHECK (feeling >= 1 AND feeling <= 10),
  highlights TEXT,

  -- Activities stored as JSONB for flexibility
  activities JSONB DEFAULT '{}',

  -- Auto-detected data
  auto_detected JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one entry per user per date
  UNIQUE(user_id, date)
);

-- Index for fast queries
CREATE INDEX idx_entries_user_date ON entries(user_id, date DESC);
CREATE INDEX idx_entries_location ON entries(user_id, location);
CREATE INDEX idx_entries_feeling ON entries(user_id, feeling);

-- =============================================
-- USER SETTINGS TABLE
-- =============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Settings as JSONB for flexibility
  settings JSONB DEFAULT '{
    "version": "trust",
    "uiStyle": "modern",
    "activityOrder": ["workout", "travel", "work", "social", "wellness", "creative", "food", "sleep"],
    "enableCalendarSync": false,
    "enableGmailSync": false,
    "enableStripeSync": false,
    "enableLocationDetection": true,
    "notificationsEnabled": false
  }',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- =============================================
-- RESEARCH LISTS TABLE (Deep Research Agent data)
-- =============================================
CREATE TABLE research_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- List type: spotify, reading, watchlist, places
  list_type TEXT NOT NULL CHECK (list_type IN ('spotify', 'reading', 'watchlist', 'places')),

  -- Items stored as JSONB array
  items JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, list_type)
);

-- =============================================
-- RESEARCH HISTORY TABLE
-- =============================================
CREATE TABLE research_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cached_result JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_history_user ON research_history(user_id, created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (Users can only see their own data)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_history ENABLE ROW LEVEL SECURITY;

-- Entries policies
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Research lists policies
CREATE POLICY "Users can view own research lists" ON research_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research lists" ON research_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research lists" ON research_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own research lists" ON research_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Research history policies
CREATE POLICY "Users can view own research history" ON research_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research history" ON research_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own research history" ON research_history
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER research_lists_updated_at
  BEFORE UPDATE ON research_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- CSV EXPORT VIEW (Flattened for easy export)
-- =============================================
CREATE OR REPLACE VIEW entries_export AS
SELECT
  e.date,
  e.location,
  e.other_location_name,
  e.trip_type,
  e.feeling,
  e.highlights,

  -- Location coordinates (for mapping)
  (e.auto_detected->'location'->>'latitude')::FLOAT as latitude,
  (e.auto_detected->'location'->>'longitude')::FLOAT as longitude,
  e.auto_detected->'location'->>'name' as detected_location,

  -- Workout
  e.activities->'workout'->>'type' as workout_type,
  (e.activities->'workout'->>'duration')::INTEGER as workout_duration_mins,
  e.activities->'workout'->>'intensity' as workout_intensity,

  -- Travel
  e.activities->'travel'->>'destination' as travel_destination,
  e.activities->'travel'->>'transport' as travel_transport,
  e.activities->'travel'->>'purpose' as travel_purpose,

  -- Work
  e.activities->'work'->>'projects' as work_projects,
  (e.activities->'work'->>'hours')::FLOAT as work_hours,
  e.activities->'work'->>'productivity' as work_productivity,

  -- Social
  e.activities->'social'->>'people' as social_people,
  e.activities->'social'->>'activity' as social_activity,
  e.activities->'social'->>'location' as social_location,

  -- Wellness
  e.activities->'wellness'->>'type' as wellness_type,
  (e.activities->'wellness'->>'duration')::INTEGER as wellness_duration_mins,
  e.activities->'wellness'->>'feeling' as wellness_feeling,

  -- Creative
  e.activities->'creative'->>'type' as creative_type,
  e.activities->'creative'->>'project' as creative_project,
  (e.activities->'creative'->>'duration')::INTEGER as creative_duration_mins,

  -- Food
  e.activities->'food'->>'breakfast' as food_breakfast,
  e.activities->'food'->>'lunch' as food_lunch,
  e.activities->'food'->>'dinner' as food_dinner,

  -- Sleep
  e.activities->'sleep'->>'bedtime' as sleep_bedtime,
  e.activities->'sleep'->>'waketime' as sleep_waketime,
  e.activities->'sleep'->>'quality' as sleep_quality,

  -- Metadata
  e.user_id,
  e.created_at,
  e.updated_at

FROM entries e;

-- RLS for the view
CREATE POLICY "Users can view own export data" ON entries
  FOR SELECT USING (auth.uid() = user_id);
```

You should see "Success. No rows returned" - that means it worked.

### Step 2.3: Verify Tables

1. Click **Table Editor** in left sidebar
2. You should see: `entries`, `user_settings`, `research_lists`, `research_history`

---

## Phase 3: Set Up Authentication (10 minutes)

### Step 3.1: Enable Email Auth

1. Go to **Authentication → Providers**
2. **Email** should already be enabled
3. Optionally disable "Confirm email" for easier testing (turn back on for production)

### Step 3.2: Enable Google Auth (Optional but Recommended)

1. Go to **Authentication → Providers → Google**
2. Toggle it ON
3. You need Google OAuth credentials:

**Get Google credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**
8. Paste them in Supabase Google provider settings

### Step 3.3: Configure Auth Settings

Go to **Authentication → URL Configuration**:

- **Site URL:** Your production URL (e.g., `https://ytt.yourdomain.com`) or `http://localhost:5173` for dev
- **Redirect URLs:** Add both:
  - `http://localhost:5173`
  - Your production URL

---

## Phase 4: Install Supabase in Your App (5 minutes)

### Step 4.1: Install Package

Run in your project directory:

```bash
npm install @supabase/supabase-js
```

### Step 4.2: Create Environment File

Create `.env.local` in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace with your actual values from Phase 1, Step 1.3**

### Step 4.3: Update .gitignore

Make sure `.env.local` is in your `.gitignore` (it should be by default with Vite).

---

## Phase 5: Code Integration (I will implement this)

Once you complete Phases 1-4, let me know and I will:

1. **Create Supabase client** (`src/lib/supabase.ts`)
2. **Create Auth context** (`src/contexts/AuthContext.tsx`)
3. **Create Login/Signup pages**
4. **Update EntriesContext** to use Supabase instead of localStorage
5. **Add CSV export feature** with all your data flattened
6. **Add data migration** tool to import existing localStorage data
7. **Add protected routes**

---

## Phase 6: CSV Export Feature

The database view `entries_export` provides a flattened structure perfect for CSV:

| Column | Description | Use Case |
|--------|-------------|----------|
| `date` | Entry date | All |
| `location` | City name | Taxes, Mapping |
| `trip_type` | business/pleasure | Taxes |
| `latitude`, `longitude` | GPS coords | Mapping |
| `feeling` | 1-10 mood | Personal dev |
| `work_hours` | Hours worked | Taxes |
| `travel_destination` | Where you went | Taxes |
| `travel_purpose` | Why you traveled | Taxes |

**Export will include:**
- Filter by date range
- Filter by location
- Download as CSV
- One-click export from Dashboard

---

## Checklist

Complete these steps, then reply to me:

- [ ] Created Supabase account
- [ ] Created project and saved the database password
- [ ] Copied Project URL and anon key
- [ ] Ran the SQL schema (all tables created)
- [ ] Enabled email authentication
- [ ] (Optional) Set up Google authentication
- [ ] Ran `npm install @supabase/supabase-js`
- [ ] Created `.env.local` with your Supabase credentials

---

## Estimated Costs

| Usage Level | Monthly Cost |
|-------------|--------------|
| 5 users, light use | **$0** (free tier) |
| 5 users, heavy use | **$0** (free tier) |
| 50+ users | **$25/mo** (Pro tier) |

Free tier includes:
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 500,000 edge function invocations

You won't hit these limits with 5 users.

---

## Questions?

Common issues:
- **"permission denied"** → RLS policies not set up correctly
- **"JWT expired"** → Need to refresh auth token (handled by SDK)
- **Can't connect** → Check your URL and anon key in `.env.local`

Let me know when you've completed the setup steps!
