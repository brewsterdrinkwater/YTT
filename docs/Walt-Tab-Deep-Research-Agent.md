# Walt-Tab - Personal Life Tracking App

## Mission

Walt-Tab is a personal data management application built for human experience. It helps you organize all of your information, recommendations, and opinions from real life and online, transforming them into real-world lived experiences.

**Walt-Tab is a product of Alt-Tab.**

The app provides a simple, intentional way to:

- **Track how you feel** each day on a 1-10 scale
- **Log activities** like workouts, travel, work, social events, wellness, creative projects, food, and sleep
- **Capture highlights** and reflections that make each day unique
- **Research and discover** new artists, authors, and creators to explore
- **Build personal lists** of music to listen to, books to read, and films to watch

Walt-Tab is built with privacy in mind—your data stays on your device unless you explicitly choose to integrate external services.

---

## App Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Walt-Tab Application                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      HOME SCREEN                             │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                   │    │
│  │  │ Date Navigator  │  │ Calendar View   │                   │    │
│  │  └─────────────────┘  └─────────────────┘                   │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                   │    │
│  │  │ Location Select │  │ Deep Research   │ ← NEW             │    │
│  │  └─────────────────┘  │    Agent        │                   │    │
│  │  ┌─────────────────┐  └─────────────────┘                   │    │
│  │  │ Feeling Scale   │  (How are you feeling? 1-10)           │    │
│  │  └─────────────────┘                                        │    │
│  │  ┌─────────────────┐                                        │    │
│  │  │ Activity Tiles  │  (Workout, Travel, Work, etc.)         │    │
│  │  └─────────────────┘                                        │    │
│  │  ┌─────────────────┐                                        │    │
│  │  │ Highlights      │  (Notes & reflections)                 │    │
│  │  └─────────────────┘                                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                     Storage Layer (localStorage)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Entries  │ │ Settings │ │ Research │ │  Lists   │              │
│  │          │ │          │ │ History  │ │(Spotify, │              │
│  │          │ │          │ │          │ │ Reading, │              │
│  │          │ │          │ │          │ │ Watch)   │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Deep Research Agent

The Deep Research Agent is an integrated tool that lets you research people (artists, authors, actors, leaders) and build personal discovery lists—all without leaving your diary.

### Features

| Feature | Description |
|---------|-------------|
| **Person Research** | Enter any name to get comprehensive biographical info |
| **Timeline of Work** | Chronological list of their major works with links |
| **Deep Cuts** | Underrated or overlooked works worth exploring |
| **Controversy Check** | Documented issues (sexual misconduct, domestic violence, racism) |
| **Leader Background** | For CEOs/Presidents: high school, college, fraternities |
| **Primary Sources** | Only tier-1 sources (interviews, major publications, official records) |
| **Listen List** | Track artists you want to listen to (Spotify) |
| **Reading List** | Track authors with Kindle links |
| **Watchlist** | Track actors with IMDB links |
| **Places to Visit** | Track places associated with researched people |
| **Cached Results** | Past research is cached for instant access |

### Where It Appears

The Deep Research Agent is available on every page:

| Page | Behavior |
|------|----------|
| **Home** (`/`) | Collapsible card above "How are you feeling?" |
| **Dashboard** (`/dashboard`) | Collapsible card + Research Lists section showing all saved items |
| **Timeline** (`/timeline`) | Collapsible card at top of page |
| **Search** (`/search`) | Research History with clickable cached results |

### How It Works

```
1. User enters name → "Toni Morrison"
                          ↓
2. App shows loading state with progress
                          ↓
3. Claude API researches with web search
   - Gathers biographical data
   - Searches for controversies specifically
   - Finds primary sources
   - Locates action links (Spotify, Kindle, IMDB)
                          ↓
4. Results displayed in formatted sections:
   ┌─────────────────────────────────┐
   │ TONI MORRISON (1931-2019)       │
   │ Category: Author                │
   ├─────────────────────────────────┤
   │ ⭐ KNOWN FOR                    │
   │ • Nobel Prize in Literature     │
   │ • Beloved, The Bluest Eye       │
   ├─────────────────────────────────┤
   │ ⚠️ CONTROVERSIES                │
   │ None documented                 │
   ├─────────────────────────────────┤
   │ 📅 TIMELINE                     │
   │ 1970 - The Bluest Eye [link]    │
   │ 1973 - Sula [link]              │
   ├─────────────────────────────────┤
   │ 💎 DEEP CUTS                    │
   │ "Sula" - Underrated...          │
   ├─────────────────────────────────┤
   │ 📚 SOURCES                      │
   │ [Primary] Paris Review, 1993    │
   │ [Secondary] NYT Obituary        │
   ├─────────────────────────────────┤
   │ [📖 Add to Reading List]        │
   └─────────────────────────────────┘
                          ↓
5. User clicks "Add to Reading List"
                          ↓
6. Saved to localStorage
   - Available in "My Lists" tab
   - Persists between sessions
```

---

## Persistent Storage

Walt-Tab uses browser localStorage for all data persistence. This means your data stays on your device and is available offline.

### Storage Keys

| Key | Purpose | File Location |
|-----|---------|---------------|
| `walt-tab-entries` | Daily diary entries | `src/contexts/EntriesContext.tsx` |
| `walt-tab-settings` | User preferences | `src/contexts/SettingsContext.tsx` |
| `walt-tab-activity-order` | Custom activity tile order | `src/contexts/SettingsContext.tsx` |
| `walt-tab-research-spotify-list` | Artists to listen to | `src/services/researchService.ts` |
| `walt-tab-research-reading-list` | Books to read (Kindle) | `src/services/researchService.ts` |
| `walt-tab-research-watchlist` | Films/TV to watch | `src/services/researchService.ts` |
| `walt-tab-research-places-list` | Places to visit | `src/services/researchService.ts` |
| `walt-tab-research-history` | Past research queries (with cached results) | `src/services/researchService.ts` |
| `walt-tab-research-api-key` | Claude API key | `src/services/researchService.ts` |

### Storage Service

All storage operations go through a single service at `src/services/storageService.ts`:

```typescript
import { storageService } from './services/storageService';

// Read data
const entries = storageService.get<Entry[]>('walt-tab-entries');

// Write data
storageService.set('walt-tab-entries', entries);

// Check if data exists
if (storageService.exists('walt-tab-entries')) { ... }

// Remove data
storageService.remove('walt-tab-entries');
```

### Switching to a Different Storage Backend

If you want to use a database instead of localStorage:

1. **Modify `src/services/storageService.ts`** to call your backend API
2. **All components use this service**, so changes propagate automatically
3. **Consider**: Supabase, Firebase, or your own REST API

---

## Data Schemas

### Daily Entry

```typescript
interface Entry {
  id: string;                    // UUID
  date: string;                  // ISO 8601 date
  location: string;              // "nashville" | "nyc" | "other"
  otherLocationName?: string;    // Custom location name
  tripType?: 'business' | 'pleasure';
  feeling: number;               // 1-10 scale
  highlights?: string;           // Free-form notes
  activities: {
    workout?: WorkoutActivity;
    travel?: TravelActivity;
    work?: WorkActivity;
    social?: SocialActivity;
    wellness?: WellnessActivity;
    creative?: CreativeActivity;
    food?: FoodActivity;
    sleep?: SleepActivity;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Research Result

```typescript
interface ResearchResult {
  name: string;
  category: 'artist' | 'author' | 'actor' | 'leader' | 'scientist' | 'athlete' | 'other';
  birthYear: number | null;
  deathYear: number | null;
  birthPlace: string | null;
  summary: string;

  // For leaders/CEOs/Presidents
  leaderInfo: {
    include: boolean;
    highSchool: string | null;
    college: string | null;
    fraternity: string | null;
    positions: string[];
  } | null;

  famousFor: string[];

  controversies: {
    sexualMisconduct: Controversy[];
    domesticViolence: Controversy[];
    racism: Controversy[];
  };

  timeline: TimelineItem[];
  deepCuts: DeepCut[];
  sources: Source[];

  actionLinks: {
    spotify: string | null;
    kindle: string | null;
    imdb: string | null;
    wikipedia: string | null;
  };
}
```

### Saved Lists

```typescript
// Spotify List
interface SpotifyListItem {
  name: string;
  spotifyUrl: string | null;
  addedAt: string;
}

// Reading List
interface ReadingListItem {
  name: string;
  works: string[];
  kindleUrl: string | null;
  addedAt: string;
}

// Watchlist
interface WatchlistItem {
  name: string;
  works: string[];
  imdbUrl: string | null;
  addedAt: string;
}

// Places to Visit
interface PlacesListItem {
  name: string;
  location: string | null;
  reason: string;
  addedAt: string;
}
```

---

## Source Quality Standards

The Deep Research Agent filters for high-quality sources only.

### Tier 1 Sources (Always Include)

**Primary Sources:**
- Interviews (Paris Review, New Yorker profiles)
- Speeches and official statements
- Autobiographies and memoirs
- Court documents and official records
- The person's own writings/recordings

**Secondary Sources:**
- Peer-reviewed journals
- Biographies by credentialed authors
- Major newspapers (NYT, WaPo, WSJ, Guardian, LA Times)
- Documentaries
- Criterion Collection essays

### Tier 2 Sources (Include with context)
- Wikipedia (for overview, verify claims elsewhere)
- Encyclopaedia Britannica
- Official fan sites with primary source content

### Never Include
- AI-generated articles
- Content farms (Buzzfeed listicles, Screen Rant)
- Unverified social media posts
- Opinion blogs without credentials
- SEO-optimized fluff pieces

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/brewsterdrinkwater/YTT.git
cd YTT

# Install dependencies
npm install

# Start development server
npm run dev
```

### Claude API Key Setup

The Deep Research Agent requires a Claude API key:

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. In the app, expand the Deep Research Agent
4. Go to the Settings tab
5. Enter your API key and click Save

### CORS Configuration

The Claude API doesn't allow direct browser calls. Choose one option:

**Option A: Browser Extension (Development)**
- Install a CORS-disabling extension like "CORS Unblock"
- Enable it when using the research feature

**Option B: Backend Proxy (Production)**
- Create an API route that forwards requests to Claude
- Update the fetch URL in `src/components/research/DeepResearchAgent.tsx:138`

Example proxy (Next.js API route):
```typescript
// pages/api/research.ts
export default async function handler(req, res) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.json(data);
}
```

---

## Cost Estimates (If Self-Hosted)

| Component | Free Tier | Paid (if needed) |
|-----------|-----------|------------------|
| Anthropic API | N/A | ~$0.03/research query |
| Web Hosting | Varies by provider | $5-20/mo |
| Supabase DB | 500MB, 50K requests | $25/mo |
| Domain (walt-tab.com) | N/A | $12/year |

**For personal use**: Likely $0-5/month total

---

## Future Enhancements

### Potential Integrations
- **Spotify API**: Directly add artists to playlists
- **Goodreads/Kindle API**: Sync reading lists
- **Letterboxd/IMDB API**: Sync watchlists
- **Notion/Obsidian Export**: Export research to your note system

### Browser Extension
- Research anyone while browsing the web
- Quick-add to lists from any page
- Context menu integration

### Mobile App
- React Native version for iOS/Android
- Push notifications for daily check-ins
- Widget for quick feeling logging

---

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI (Button, Card, Modal, Input)
│   ├── entry/           # Daily entry (EntryForm, FeelingScale, ActivityTiles)
│   ├── layout/          # Header, Navigation, Settings
│   ├── location/        # Location selection & auto-detection
│   ├── research/        # Deep Research Agent
│   ├── dashboard/       # Insights & extracted data
│   ├── timeline/        # Browse past entries
│   └── calendar/        # Google Calendar integration
├── contexts/            # React Context providers
├── hooks/               # Custom hooks (useLocalStorage)
├── services/            # Storage service
├── types/               # TypeScript definitions
├── constants/           # Configuration & storage keys
└── utils/               # Utility functions
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Build: `npm run build`
6. Submit a pull request

---

## License

MIT License - See LICENSE file for details.
