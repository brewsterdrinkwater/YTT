import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { EntriesProvider } from './contexts/EntriesContext';
import { LocationProvider } from './contexts/LocationContext';

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
import SearchBar from './components/search/SearchBar';

// Main app content with routing
const AppContent: React.FC = () => {
  const { isOnboardingComplete } = useApp();
  const { settings } = useSettings();

  // Apply UI style to document
  useEffect(() => {
    document.documentElement.setAttribute('data-ui-style', settings.uiStyle);
  }, [settings.uiStyle]);

  // Show onboarding if not complete
  if (!isOnboardingComplete) {
    return <VersionSelector />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Navigation />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<EntryForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/search" element={<SearchBar />} />
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
      <AppProvider>
        <SettingsProvider>
          <EntriesProvider>
            <LocationProvider>
              <AppContent />
            </LocationProvider>
          </EntriesProvider>
        </SettingsProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
