import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { EntriesProvider } from './contexts/EntriesContext';
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
import SearchBar from './components/search/SearchBar';
import AuthPage from './components/auth/AuthPage';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
