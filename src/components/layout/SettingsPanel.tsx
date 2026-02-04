import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useEntries } from '../../contexts/EntriesContext';
import { useAuth } from '../../contexts/AuthContext';
import { exportToCSV } from '../../utils/exportCSV';
import Button from '../common/Button';
import Modal from '../common/Modal';

/**
 * Walt-tab Settings Panel
 * Brutalist style: Clean sections, high contrast, minimal decoration
 */

const SettingsPanel: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, showToast } = useApp();
  const { settings, updateSettings, setVersion, toggleApi, resetSettings } = useSettings();
  const { entries } = useEntries();
  const { user, signOut } = useAuth();
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
        className="fixed inset-0 bg-black/60 z-50"
        onClick={() => setIsSettingsOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l-2 border-black z-50 overflow-y-auto animate-slideInRight">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-black p-4 flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-black">Settings</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 hover:bg-concrete rounded-sm transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* App Version */}
          <section>
            <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
              App Version
            </h3>
            <div className="bg-concrete rounded-sm p-4 border border-steel">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-black">
                  {settings.version === 'trust' ? 'Trust Mode' : 'Secure Mode'}
                </span>
                <span
                  className={`text-tiny px-2 py-1 rounded-sm font-medium ${
                    settings.version === 'trust'
                      ? 'bg-black text-white'
                      : 'bg-steel text-charcoal'
                  }`}
                >
                  Active
                </span>
              </div>
              <p className="text-small text-slate mb-3">
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
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
                Location Tracking
              </h3>
              <label className="flex items-center justify-between p-4 bg-concrete rounded-sm border border-steel cursor-pointer">
                <div>
                  <span className="font-semibold text-black">Auto-detect Location</span>
                  <p className="text-small text-slate">Use GPS/WiFi to detect your location</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoLocation}
                  onChange={(e) => updateSettings({ autoLocation: e.target.checked })}
                  className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                />
              </label>
            </section>
          )}

          {/* Location Input Style */}
          <section>
            <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
              Location Input Style
            </h3>
            <div className="bg-concrete rounded-sm p-4 border border-steel">
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ locationStyle: 'buttons' })}
                  className={`flex-1 py-2 px-4 rounded-sm font-semibold transition-colors ${
                    settings.locationStyle === 'buttons'
                      ? 'bg-black text-white'
                      : 'bg-white text-charcoal border-2 border-steel hover:border-black'
                  }`}
                >
                  Buttons
                </button>
                <button
                  onClick={() => updateSettings({ locationStyle: 'dropdown' })}
                  className={`flex-1 py-2 px-4 rounded-sm font-semibold transition-colors ${
                    settings.locationStyle === 'dropdown'
                      ? 'bg-black text-white'
                      : 'bg-white text-charcoal border-2 border-steel hover:border-black'
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
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
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
                    className="flex items-center justify-between p-3 bg-concrete rounded-sm border border-steel cursor-pointer hover:border-charcoal transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-black">{api.label}</span>
                      <p className="text-tiny text-slate">{api.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.apis[api.key]}
                      onChange={() => toggleApi(api.key)}
                      className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                    />
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Notifications */}
          <section>
            <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
              Notifications
            </h3>
            <div className="bg-concrete rounded-sm p-4 border border-steel space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-black">Daily Reminder</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.enabled}
                  onChange={(e) =>
                    updateSettings({
                      notifications: { ...settings.notifications, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                />
              </label>
              {settings.notifications.enabled && (
                <div className="flex items-center gap-3">
                  <span className="text-small text-slate">Remind at:</span>
                  <input
                    type="time"
                    value={settings.notifications.time}
                    onChange={(e) =>
                      updateSettings({
                        notifications: { ...settings.notifications, time: e.target.value },
                      })
                    }
                    className="px-3 py-2 border-2 border-steel rounded-sm focus:outline-none focus:border-black"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Data Export */}
          <section>
            <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
              Data Export
            </h3>
            <div className="bg-concrete rounded-sm p-4 border border-steel">
              <p className="text-small text-slate mb-3">
                Export all your entries as a CSV file for backup or analysis.
              </p>
              <Button variant="secondary" onClick={handleExport}>
                Export All Data as CSV
              </Button>
              <p className="text-tiny text-slate mt-2">{entries.length} entries available</p>
            </div>
          </section>

          {/* Account */}
          {user && (
            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
                Account
              </h3>
              <div className="bg-concrete rounded-sm p-4 border border-steel">
                <p className="text-small text-charcoal mb-3">
                  Signed in as <strong className="text-black">{user.email}</strong>
                </p>
                <Button variant="secondary" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section>
            <h3 className="text-tiny font-semibold text-danger uppercase tracking-wider mb-3">
              Danger Zone
            </h3>
            <div className="bg-danger/5 border-2 border-danger/30 rounded-sm p-4">
              <p className="text-small text-charcoal mb-3">
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
        <p className="text-slate mb-4">
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
