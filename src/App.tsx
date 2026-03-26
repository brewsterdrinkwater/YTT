import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { EntriesProvider, useEntries } from './contexts/EntriesContext';
import { LocationProvider } from './contexts/LocationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ListsProvider, useLists } from './contexts/ListsContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { notificationService } from './services/notificationService';

// Layout components
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
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

  // Show loading while checking auth or loading settings from Supabase
  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="text-center">
          <div className="w-14 h-14 gradient-coral rounded-2xl flex items-center justify-center mx-auto shadow-glow-coral animate-pulse">
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <p className="mt-4 text-warm-500 font-medium">Loading...</p>
        </div>
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
    <div className="min-h-screen min-h-dvh bg-warm-50 flex flex-col">
      <Header />
      <Navigation />

      <main className="flex-1 pb-28 md:pb-6 w-full">
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
