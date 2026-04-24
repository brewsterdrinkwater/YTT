import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { EntriesProvider, useEntries } from './contexts/EntriesContext';
import { LocationProvider } from './contexts/LocationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ListsProvider, useLists } from './contexts/ListsContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { notificationService } from './services/notificationService';

// New vault shell components
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';

// Legacy layout components (kept for SettingsPanel, Toast)
import SettingsPanel from './components/layout/SettingsPanel';
import Toast from './components/common/Toast';

// Page components
import VersionSelector from './components/onboarding/VersionSelector';
import EntryForm from './components/entry/EntryForm';
import Dashboard from './components/dashboard/Dashboard';
import MissingDaysPage from './components/dashboard/MissingDaysPage';
import Timeline from './components/timeline/Timeline';
import ToolsPage from './components/tools/ToolsPage';
import AuthPage from './components/auth/AuthPage';
import ListPage from './components/lists/ListPage';
import SavedItemsPage from './components/saved/SavedItemsPage';
import ShareTargetPage from './components/saved/ShareTargetPage';
import SettingsPage from './components/settings/SettingsPage';
import InventoryPage from './components/inventory/InventoryPage';

// Smart home page - shows dashboard if today's entry is complete, otherwise entry form
const SmartHomePage: React.FC = () => {
  const { currentEntry, loading } = useEntries();
  const { settings } = useSettings();

  // Check if today's entry is "complete" based on all enabled fields
  const isTodayComplete = useMemo(() => {
    if (!currentEntry) return false;
    const fields = settings.entryFields ?? { location: true, feeling: true, activities: true, highlights: true };

    // Check each enabled field - ALL must be filled for entry to be "complete"
    if (fields.location && !currentEntry.location) return false;
    if (fields.feeling && currentEntry.feeling < 1) return false;
    if (fields.activities && !Object.values(currentEntry.activities).some(a => a !== undefined)) return false;
    if (fields.highlights && (!currentEntry.highlights || currentEntry.highlights.length === 0)) return false;

    // If no fields are enabled, default to dashboard
    if (!Object.values(fields).some(v => v)) return true;

    return true;
  }, [currentEntry, settings.entryFields]);

  // Show loading while checking entries
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-warm-200 border-t-brand-coral rounded-full animate-spin"></div>
      </div>
    );
  }

  // If today's entry is complete, show dashboard
  if (isTodayComplete) {
    return <Dashboard />;
  }

  // Otherwise show entry form
  return <EntryForm />;
};

// Notification initializer — runs inside ListsProvider
const NotificationInit: React.FC = () => {
  const { settings } = useSettings();
  const { reminders, events, markReminderSent, updateEvent, weeklyPicks, restaurantsList } = useLists();

  useEffect(() => {
    if (!settings.notifications.enabled) {
      notificationService.stopChecking();
      return;
    }

    // Request permission on first enable
    notificationService.requestPermission();

    notificationService.startChecking(
      () => reminders,
      () => events,
      (reminderId) => markReminderSent(reminderId),
      (eventId, reminderId) => {
        // Mark the specific event reminder as sent
        const event = events.find((e) => e.id === eventId);
        if (event) {
          updateEvent(eventId, {
            reminders: event.reminders.map((r) =>
              r.id === reminderId ? { ...r, sent: true, sentAt: new Date().toISOString() } : r
            ),
          });
        }
      },
      () =>
        weeklyPicks
          .map((id) => restaurantsList.find((r) => r.id === id)?.name)
          .filter(Boolean) as string[],
    );

    return () => notificationService.stopChecking();
  }, [settings.notifications.enabled, reminders, events, markReminderSent, updateEvent, weeklyPicks, restaurantsList]);

  return null;
};

// Main app content with routing
const AppContent: React.FC = () => {
  const { settings, settingsLoading } = useSettings();
  const { user, loading } = useAuth();

  // Apply UI style to document
  useEffect(() => {
    document.documentElement.setAttribute('data-ui-style', settings.uiStyle);
  }, [settings.uiStyle]);

  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Track mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarCollapsed(true);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Cmd+K / Ctrl+K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarCollapsed(true);
  };

  // Show loading while checking auth or loading settings from Supabase
  if (loading || settingsLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-vault-black)',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ animation: 'vault-unlock 0.6s ease-out' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-vault-accent)" strokeWidth="2" strokeLinecap="round">
            <circle cx="24" cy="24" r="20" />
            <circle cx="24" cy="24" r="12" />
            <circle cx="24" cy="24" r="3" fill="var(--color-vault-accent)" />
            <line x1="24" y1="12" x2="24" y2="4" />
            <line x1="24" y1="36" x2="24" y2="44" />
            <line x1="12" y1="24" x2="4" y2="24" />
            <line x1="36" y1="24" x2="44" y2="24" />
          </svg>
        </div>
        <p style={{ color: 'var(--color-vault-muted)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
          Opening your vault...
        </p>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show onboarding if not complete (stored in Supabase-backed settings)
  if (!settings.onboardingComplete) {
    return <VersionSelector />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--color-vault-black)',
      overflow: 'hidden',
    }}>
      <TopBar
        isMobile={isMobile}
        onMenuToggle={() => setSidebarCollapsed(c => !c)}
        onSearchOpen={() => setPaletteOpen(true)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Backdrop for mobile sidebar */}
        {isMobile && !sidebarCollapsed && (
          <div
            onClick={() => setSidebarCollapsed(true)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 55,
            }}
          />
        )}
        <Sidebar
          collapsed={sidebarCollapsed}
          isMobile={isMobile}
          currentPath={location.pathname}
          onNavigate={handleNavigate}
        />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px' : '32px 40px',
          paddingBottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : '32px',
          background: 'var(--color-vault-black)',
        }}>
          <Routes>
            <Route path="/" element={<SmartHomePage />} />
            <Route path="/entry" element={<EntryForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/missing-days" element={<MissingDaysPage />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/lists" element={<ListPage />} />
            <Route path="/saved" element={<SavedItemsPage />} />
            <Route path="/share" element={<ShareTargetPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            {/* Redirect old /search to /tools */}
            <Route path="/search" element={<Navigate to="/tools" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(path) => navigate(path)}
      />
      <NotificationInit />
      <SettingsPanel />
      <Toast />
    </div>
  );
};

// Root component with providers
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <SettingsProvider>
            <EntriesProvider>
              <ListsProvider>
                <InventoryProvider>
                  <LocationProvider>
                    <AppContent />
                  </LocationProvider>
                </InventoryProvider>
              </ListsProvider>
            </EntriesProvider>
          </SettingsProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
