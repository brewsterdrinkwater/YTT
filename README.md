# Valt-Tab

A personal data management application built for human experience. Valt-Tab organizes all of your information, recommendations, and opinions from real life and online, transforming them into real-world lived experiences.

**Valt-Tab is a product of Alt-Tab.**

## Features

- **Three UI Styles**: Switch between Modern, Retro, and Structured themes
- **Two Privacy Modes**: "Trust Mode" (automated sync) or "Secure Mode" (fully private)
- **Daily Entries**: Track location, mood (1-10 scale), and highlights
- **Activity Tracking**: Log workouts, travel, work, social, wellness, creative, food, and sleep
- **Deep Research Agent**: Research anyone with AI-powered web search
- **Personal Lists**: Build Listen (Spotify), Reading (Kindle), Watchlist (IMDB), and Places to Visit lists
- **Dashboard**: View research lists + auto-extracted insights from diary entries
- **Timeline View**: Browse all entries with location filtering
- **Search**: Full-text search + research history with cached results
- **CSV Export**: Export all data for backup or analysis

## UI Styles

Choose your preferred experience from the dropdown in the header:

### Modern (Instagram/Tinder Style)
- Swipeable cards with one question at a time
- Glassmorphism and smooth animations
- Dark theme with gradient accents
- Gesture-based interactions

```
┌───────────────────────────┐
│     ┌───────────────┐     │
│     │  📍 Where     │     │
│     │   are you?    │     │
│     │  🎸    🗽     │     │
│     │ ← swipe →     │     │
│     └───────────────┘     │
│      ○ ○ ● ○ ○ ○          │
└───────────────────────────┘
```

### Retro (Oregon Trail / 8-Bit)
- Pixel art aesthetic with chunky borders
- Game Boy green color palette
- Keyboard-first navigation
- HP bar style mood tracking

```
╔═══════════════════════════╗
║  WALT-TAB DAILY LOG v1.0  ║
╠═══════════════════════════╣
║  WHERE ARE YOU TRAVELER?  ║
║  [1] ♪ NASHVILLE          ║
║  [2] ⌂ NEW YORK CITY      ║
║  HP: ████████░░ 8/10      ║
╚═══════════════════════════╝
```

### Structured (Clean + Colorful)
- Form-based layout with clear sections
- Color-coded activity tiles
- Bold section headers
- Professional, organized feel

```
┌───────────────────────────┐
│ ┃ 📍 LOCATION            ┃│
│ │ ▣ Nashville ○ NYC      ││
├───────────────────────────┤
│ ┃ 😊 FEELING             ┃│
│ │ [1][2][3][4][5][█][7]  ││
├───────────────────────────┤
│ ┃ 📋 ACTIVITIES          ┃│
│ │ 🏋️ ✈️ 💼 👥            ││
└───────────────────────────┘
```

## Deep Research Agent

Research anyone and build personal discovery lists:

- **🎵 Listen List**: Artists to explore on Spotify
- **📚 Reading List**: Authors with Kindle links
- **🎬 Watchlist**: Actors with IMDB links
- **📍 Places to Visit**: Destinations from research

Features include:
- Timeline of work with links
- Deep cuts (underrated works)
- Controversy tracking
- Primary/secondary source verification
- Cached results for instant access

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **@dnd-kit** for drag-and-drop activity reordering
- **date-fns** for date manipulation
- **localStorage** for data persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd YTT
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example file:
```bash
cp .env.example .env
```

4. (Optional) Add your API keys to `.env` for Trust Mode features:
```bash
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components (Button, Modal, Card, Input)
│   ├── layout/          # Layout components (Header, Navigation, SettingsPanel)
│   ├── location/        # Location selection and detection
│   ├── entry/           # Entry form components
│   ├── calendar/        # Google Calendar integration
│   ├── dashboard/       # Dashboard with insights
│   ├── timeline/        # Timeline view
│   ├── search/          # Search functionality
│   └── onboarding/      # Version selector
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── services/            # API and service integrations
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # App constants and configuration
└── App.tsx              # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Data Storage

All data is stored locally in your browser's localStorage. No data is sent to external servers (except for optional Trust Mode integrations).

### Exporting Data

You can export all your entries as a CSV file from:
- Timeline view (Export CSV button)
- Settings panel (Export All Data as CSV)

## Privacy

- **Secure Mode**: All data stays on your device. No external API calls.
- **Trust Mode**: Optional integrations with Google Calendar, Gmail, and Stripe for automated data collection.

## License

MIT
