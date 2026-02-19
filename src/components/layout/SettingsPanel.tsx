import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useEntries } from '../../contexts/EntriesContext';
import { useAuth } from '../../contexts/AuthContext';
import { EntryFieldType, CustomLocation } from '../../types';
import { exportToCSV } from '../../utils/exportCSV';
import { sharingService } from '../../services/sharingService';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { Input } from '../common/Input';

const LOCATION_ICONS = ['🏠', '🏢', '🌆', '🏖️', '🏔️', '🎸', '🗽', '🌍', '✈️', '🏡'];

const ENTRY_FIELD_OPTIONS: { key: EntryFieldType; label: string; icon: string }[] = [
  { key: 'location', label: 'Location', icon: '📍' },
  { key: 'feeling', label: 'Mood', icon: '😊' },
  { key: 'activities', label: 'Activities', icon: '📝' },
  { key: 'highlights', label: 'Highlights', icon: '✨' },
];

/**
 * Walt-tab Settings Panel
 * Brutalist style: Clean sections, high contrast, minimal decoration
 */

const SettingsPanel: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, showToast } = useApp();
  const { settings, updateSettings, setVersion, toggleApi, resetSettings } = useSettings();
  const { entries, migrateFromLocalStorage } = useEntries();
  const { user, signOut } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneLoaded, setPhoneLoaded] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocIcon, setNewLocIcon] = useState('🏠');
  const [showLocIconPicker, setShowLocIconPicker] = useState(false);

  // Load user phone number on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user && isSettingsOpen && !phoneLoaded) {
        const profile = await sharingService.getMyProfile();
        if (profile?.phone_number) {
          setPhone(formatPhoneDisplay(profile.phone_number));
        }
        setPhoneLoaded(true);
      }
    };
    loadProfile();
  }, [user, isSettingsOpen, phoneLoaded]);

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleSavePhone = async () => {
    if (!sharingService.isValidPhone(phone)) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    setSavingPhone(true);
    const result = await sharingService.updateMyProfile({ phone_number: phone });
    setSavingPhone(false);

    if (result.success) {
      showToast('Phone number saved! You can now receive shared lists.', 'success');
    } else {
      showToast(result.error || 'Failed to save phone number', 'error');
    }
  };

  const handleExport = () => {
    if (entries.length === 0) {
      showToast('No entries to export', 'warning');
      return;
    }
    exportToCSV(entries);
    showToast(`Exported ${entries.length} entries`, 'success');
  };

  const handleImport = async () => {
    setMigrating(true);
    try {
      const count = await migrateFromLocalStorage();
      if (count > 0) {
        showToast(`Imported ${count} entries from local storage`, 'success');
      } else {
        showToast('No new entries to import', 'info');
      }
    } catch {
      showToast('Import failed', 'error');
    }
    setMigrating(false);
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const entryFields = settings.entryFields ?? { location: true, feeling: true, activities: true, highlights: true };
  const customLocations = settings.customLocations ?? [];

  const toggleEntryField = (field: EntryFieldType) => {
    updateSettings({
      entryFields: { ...entryFields, [field]: !entryFields[field] },
    });
  };

  const handleAddLocation = () => {
    if (!newLocName.trim()) return;
    const id = newLocName.trim().toLowerCase().replace(/\s+/g, '-');
    if (customLocations.some(loc => loc.id === id)) {
      showToast('Location already exists', 'warning');
      return;
    }
    updateSettings({
      customLocations: [...customLocations, { id, name: newLocName.trim(), icon: newLocIcon }],
    });
    setNewLocName('');
    setNewLocIcon('🏠');
    setShowLocIconPicker(false);
  };

  const handleRemoveLocation = (id: string) => {
    updateSettings({
      customLocations: customLocations.filter((loc: CustomLocation) => loc.id !== id),
    });
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

          {/* Entry Fields */}
          <section>
            <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
              Entry Fields
            </h3>
            <div className="space-y-2">
              {ENTRY_FIELD_OPTIONS.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center justify-between p-3 bg-concrete rounded-sm border border-steel cursor-pointer hover:border-charcoal transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{field.icon}</span>
                    <span className="font-semibold text-black">{field.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={entryFields[field.key]}
                    onChange={() => toggleEntryField(field.key)}
                    className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Custom Locations */}
          {entryFields.location && (
            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
                My Locations
              </h3>
              <div className="bg-concrete rounded-sm p-4 border border-steel space-y-3">
                {customLocations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customLocations.map((loc: CustomLocation) => (
                      <span
                        key={loc.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-sm border border-steel text-sm"
                      >
                        <span>{loc.icon}</span>
                        <span className="font-medium">{loc.name}</span>
                        <button
                          onClick={() => handleRemoveLocation(loc.id)}
                          className="ml-1 text-slate hover:text-danger transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLocIconPicker(!showLocIconPicker)}
                    className="w-10 h-10 border-2 border-steel rounded-sm flex items-center justify-center text-lg hover:border-black transition-colors flex-shrink-0"
                  >
                    {newLocIcon}
                  </button>
                  <Input
                    placeholder="Add location..."
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    className="flex-1 !mb-0"
                  />
                  <Button onClick={handleAddLocation} disabled={!newLocName.trim()} size="sm">
                    Add
                  </Button>
                </div>
                {showLocIconPicker && (
                  <div className="flex flex-wrap gap-1 p-2 bg-white rounded-sm border border-steel">
                    {LOCATION_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => { setNewLocIcon(icon); setShowLocIconPicker(false); }}
                        className={`w-9 h-9 rounded-sm flex items-center justify-center text-lg hover:bg-steel transition-colors ${
                          newLocIcon === icon ? 'bg-steel' : ''
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-tiny text-slate">"Other" is always available as a fallback option.</p>
              </div>
            </section>
          )}

          {/* Location Input Style */}
          {entryFields.location && (
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
          )}

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

          {/* Data Management */}
          <section>
            <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
              Data Management
            </h3>
            <div className="bg-concrete rounded-sm p-4 border border-steel space-y-4">
              <div>
                <p className="text-small text-slate mb-2">
                  Export your entries for backup or analysis.
                </p>
                <Button variant="secondary" onClick={handleExport} className="w-full">
                  Export Data as CSV
                </Button>
              </div>
              <div className="border-t border-steel pt-4">
                <p className="text-small text-slate mb-2">
                  Import entries from local browser storage.
                </p>
                <Button
                  variant="secondary"
                  onClick={handleImport}
                  disabled={migrating}
                  className="w-full"
                >
                  {migrating ? 'Importing...' : 'Import from Local Storage'}
                </Button>
              </div>
              <p className="text-tiny text-charcoal font-medium pt-2 border-t border-steel">
                {entries.length} entries in your account
              </p>
            </div>
          </section>

          {/* Account */}
          {user && (
            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">
                Account
              </h3>
              <div className="bg-concrete rounded-sm p-4 border border-steel space-y-4">
                <p className="text-small text-charcoal">
                  Signed in as <strong className="text-black">{user.email}</strong>
                </p>

                {/* Phone Number for List Sharing */}
                <div className="border-t border-steel pt-4">
                  <label className="block text-small font-semibold text-black mb-2">
                    Phone Number (for list sharing)
                  </label>
                  <p className="text-tiny text-slate mb-2">
                    Add your phone number so others can share lists with you.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                      className="flex-1 !mb-0"
                      maxLength={14}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSavePhone}
                      disabled={savingPhone || !phone}
                    >
                      {savingPhone ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-steel pt-4">
                  <Button variant="secondary" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
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
