import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useEntries } from '../../contexts/EntriesContext';
import { exportToCSV } from '../../utils/exportCSV';
import Button from '../common/Button';
import Modal from '../common/Modal';

const SettingsPanel: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, showToast } = useApp();
  const { settings, updateSettings, setVersion, toggleApi, resetSettings } = useSettings();
  const { entries } = useEntries();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExport = () => {
    if (entries.length === 0) {
      showToast('No entries to export', 'warning');
      return;
    }
    exportToCSV(entries);
    showToast(`Exported ${entries.length} entries`, 'success');
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!isSettingsOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsSettingsOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto animate-slideInRight">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* App Version */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              App Version
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {settings.version === 'trust' ? 'Trust Mode' : 'Secure Mode'}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    settings.version === 'trust'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {settings.version === 'trust'
                  ? 'Auto-sync with external services for convenience'
                  : 'All data stored locally for maximum privacy'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVersion(settings.version === 'trust' ? 'secure' : 'trust')}
              >
                Switch to {settings.version === 'trust' ? 'Secure' : 'Trust'} Mode
              </Button>
            </div>
          </section>

          {/* Location Settings */}
          {settings.version === 'trust' && (
            <section>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Location Tracking
              </h3>
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <span className="font-medium">Auto-detect Location</span>
                  <p className="text-sm text-gray-500">Use GPS/WiFi to detect your location</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoLocation}
                  onChange={(e) => updateSettings({ autoLocation: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
              </label>
            </section>
          )}

          {/* Location Input Style */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Location Input Style
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex gap-3">
                <button
                  onClick={() => updateSettings({ locationStyle: 'buttons' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    settings.locationStyle === 'buttons'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Buttons
                </button>
                <button
                  onClick={() => updateSettings({ locationStyle: 'dropdown' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    settings.locationStyle === 'dropdown'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Dropdown
                </button>
              </div>
            </div>
          </section>

          {/* Data Sources (Trust Mode) */}
          {settings.version === 'trust' && (
            <section>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Data Sources
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'gmail' as const, label: 'Gmail', desc: 'Scan emails for reservations' },
                  { key: 'stripe' as const, label: 'Stripe', desc: 'Import transaction data' },
                  { key: 'calendar' as const, label: 'Google Calendar', desc: 'Show calendar events' },
                  {
                    key: 'mapsTimeline' as const,
                    label: 'Google Maps',
                    desc: 'Location history',
                  },
                ].map((api) => (
                  <label
                    key={api.key}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">{api.label}</span>
                      <p className="text-xs text-gray-500">{api.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.apis[api.key]}
                      onChange={() => toggleApi(api.key)}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Notifications */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Notifications
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium">Daily Reminder</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.enabled}
                  onChange={(e) =>
                    updateSettings({
                      notifications: { ...settings.notifications, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
              </label>
              {settings.notifications.enabled && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Remind at:</span>
                  <input
                    type="time"
                    value={settings.notifications.time}
                    onChange={(e) =>
                      updateSettings({
                        notifications: { ...settings.notifications, time: e.target.value },
                      })
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Data Export */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Data Export
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-3">
                Export all your entries as a CSV file for backup or analysis.
              </p>
              <Button variant="secondary" onClick={handleExport}>
                Export All Data as CSV
              </Button>
              <p className="text-xs text-gray-400 mt-2">{entries.length} entries available</p>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h3 className="text-sm font-medium text-danger uppercase tracking-wider mb-3">
              Danger Zone
            </h3>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-3">
                This will permanently delete all your data. This action cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
                Clear All Data
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data?"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete all your entries and settings? This action cannot be
          undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearData}>
            Yes, Clear Everything
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default SettingsPanel;
