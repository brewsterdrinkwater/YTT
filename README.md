# YTT - Yesterday, Today, Tomorrow

A dual-mode life tracking application that helps users document their daily experiences through either automated data collection or manual privacy-focused entry.

## Features

- **Two Modes**: Choose between "Trust Mode" (automated sync with external services) or "Secure Mode" (fully private, local storage only)
- **Daily Entries**: Track location, mood (1-10 scale), and highlights for each day
- **Activity Tracking**: Log workouts, travel, work, social activities, wellness, creative projects, food, and sleep
- **Google Calendar Integration**: View your calendar events alongside daily entries (Trust Mode)
- **Dashboard**: Automatic extraction and categorization of workouts, food recommendations, travel, books, and ideas
- **Timeline View**: Browse all entries with location filtering
- **Search**: Full-text search across all entries
- **CSV Export**: Export all data for backup or analysis
- **Mobile-First Design**: Optimized for phone use with a responsive web app

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
