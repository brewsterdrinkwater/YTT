import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { EntriesProvider, useEntries } from './contexts/EntriesContext';
import { LocationProvider } from './contexts/LocationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout components
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import SettingsPanel from './components/layout/SettingsPanel';
import Toast from './components/common/Toast';

// Page components
import VersionSelector from './components/onboarding/VersionSelector';
import EntryForm from './components/entry/EntryForm';
import Dashboard from './components/dashboard/Dashboard';
import Timeline from './components/timeline/Timeline';
import ToolsPage from './components/tools/ToolsPage';
import AuthPage from './components/auth/AuthPage';
import ListPage from './components/lists/ListPage';

// Smart home page - shows dashboard if today's entry is complete, otherwise entry form
const SmartHomePage: React.FC = () => {
  const { currentEntry, loading } = useEntries();

  // Check if today's entry is "complete" (has location and feeling set)
  const isTodayComplete = useMemo(() => {
    if (!currentEntry) return false;
    // Entry is complete if it has a location set
    return currentEntry.location !== '';
  }, [currentEntry]);

  // Show loading while checking entries
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
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

// Main app content with routing
const AppContent: React.FC = () => {
  const { isOnboardingComplete } = useApp();
  const { settings } = useSettings();
  const { user, loading } = useAuth();

  // Apply UI style to document
  useEffect(() => {
    document.documentElement.setAttribute('data-ui-style', settings.uiStyle);
  }, [settings.uiStyle]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent mx-auto"></div>
          <p className="mt-4 text-charcoal font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show onboarding if not complete
  if (!isOnboardingComplete) {
    return <VersionSelector />;
  }

  return (
    <div className="min-h-screen bg-concrete flex flex-col">
      <Header />
      <Navigation />

      <main className="flex-1 pb-24 md:pb-6">
        <Routes>
          <Route path="/" element={<SmartHomePage />} />
          <Route path="/entry" element={<EntryForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/lists" element={<ListPage />} />
          {/* Redirect old /search to /tools */}
          <Route path="/search" element={<Navigate to="/tools" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

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
              <LocationProvider>
                <AppContent />
              </LocationProvider>
            </EntriesProvider>
          </SettingsProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
