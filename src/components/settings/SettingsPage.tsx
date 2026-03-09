import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useEntries } from '../../contexts/EntriesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { EntryFieldType, CustomLocation } from '../../types';
import { exportToCSV } from '../../utils/exportCSV';
import { sharingService } from '../../services/sharingService';
import { notificationService } from '../../services/notificationService';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { Input } from '../common/Input';

const LOCATION_ICONS = ['🏠', '🏢', '🌆', '🏖️', '🏔️', '🎸', '🗽', '🌍', '✈️', '🏡'];

const ENTRY_FIELD_OPTIONS: { key: EntryFieldType; label: string; icon: string; description: string }[] = [
  { key: 'location', label: 'Location', icon: '📍', description: 'Where you are today' },
  { key: 'feeling', label: 'Mood', icon: '😊', description: 'How you are feeling (1-10)' },
  { key: 'activities', label: 'Activities', icon: '📝', description: 'What you did today' },
  { key: 'highlights', label: 'Highlights', icon: '✨', description: 'Best moments of the day' },
];

type SettingsSection =
  | 'general'
  | 'entry'
  | 'dashboard'
  | 'timeline'
  | 'lists'
  | 'tools'
  | 'notifications'
  | 'account'
  | 'data';

interface SectionConfig {
  id: SettingsSection;
  label: string;
  icon: string;
}

const SECTIONS: SectionConfig[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'entry', label: 'Entry Form', icon: '📝' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'timeline', label: 'Timeline', icon: '🕐' },
  { id: 'lists', label: 'Lists', icon: '📋' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'data', label: 'Data', icon: '💾' },
];

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, setVersion, toggleApi, resetSettings } = useSettings();
  const { entries, migrateFromLocalStorage } = useEntries();
  const { user, signOut } = useAuth();
  const { showToast } = useApp();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneLoaded, setPhoneLoaded] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocIcon, setNewLocIcon] = useState('🏠');
  const [showLocIconPicker, setShowLocIconPicker] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Load phone number
  useEffect(() => {
    const loadProfile = async () => {
      if (user && !phoneLoaded) {
        const profile = await sharingService.getMyProfile();
        if (profile?.phone_number) {
          setPhone(formatPhoneDisplay(profile.phone_number));
        }
        setPhoneLoaded(true);
      }
    };
    loadProfile();
  }, [user, phoneLoaded]);

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
      showToast('Phone number saved!', 'success');
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
    updateSettings({ entryFields: { ...entryFields, [field]: !entryFields[field] } });
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

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      showToast('Notifications enabled!', 'success');
    } else {
      showToast('Notifications blocked. Enable them in browser settings.', 'warning');
    }
  };

  const handleSectionClick = (section: SettingsSection) => {
    setActiveSection(section);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">General Settings</h2>

            {/* App Version */}
            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">App Version</h3>
              <div className="bg-concrete rounded-sm p-4 border border-steel">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-black">
                    {settings.version === 'trust' ? 'Trust Mode' : 'Secure Mode'}
                  </span>
                  <span className={`text-tiny px-2 py-1 rounded-sm font-medium ${settings.version === 'trust' ? 'bg-black text-white' : 'bg-steel text-charcoal'}`}>
                    Active
                  </span>
                </div>
                <p className="text-small text-slate mb-3">
                  {settings.version === 'trust'
                    ? 'Auto-sync with external services for convenience'
                    : 'All data stored locally for maximum privacy'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => setVersion(settings.version === 'trust' ? 'secure' : 'trust')}>
                  Switch to {settings.version === 'trust' ? 'Secure' : 'Trust'} Mode
                </Button>
              </div>
            </section>

            {/* Theme */}
            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Theme</h3>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ theme })}
                    className={`flex-1 py-2 px-4 rounded-sm font-semibold capitalize text-sm transition-colors ${
                      settings.theme === theme
                        ? 'bg-black text-white'
                        : 'bg-white text-charcoal border-2 border-steel hover:border-black'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </section>

            {/* UI Style */}
            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">UI Style</h3>
              <div className="flex gap-2">
                {(['modern', 'retro', 'structured'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateSettings({ uiStyle: style })}
                    className={`flex-1 py-2 px-4 rounded-sm font-semibold capitalize text-sm transition-colors ${
                      settings.uiStyle === style
                        ? 'bg-black text-white'
                        : 'bg-white text-charcoal border-2 border-steel hover:border-black'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </section>
          </div>
        );

      case 'entry':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Entry Form Settings</h2>
            <p className="text-sm text-slate">Choose which fields appear on your daily entry form.</p>

            {/* Entry Fields */}
            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Fields</h3>
              <div className="space-y-2">
                {ENTRY_FIELD_OPTIONS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center justify-between p-3 bg-concrete rounded-sm border border-steel cursor-pointer hover:border-charcoal transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{field.icon}</span>
                      <div>
                        <span className="font-semibold text-black">{field.label}</span>
                        <p className="text-xs text-slate">{field.description}</p>
                      </div>
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
                <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">My Locations</h3>
                <div className="bg-concrete rounded-sm p-4 border border-steel space-y-3">
                  {customLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customLocations.map((loc: CustomLocation) => (
                        <span key={loc.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-sm border border-steel text-sm">
                          <span>{loc.icon}</span>
                          <span className="font-medium">{loc.name}</span>
                          <button onClick={() => handleRemoveLocation(loc.id)} className="ml-1 text-slate hover:text-red-500">
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
                      className="w-10 h-10 border-2 border-steel rounded-sm flex items-center justify-center text-lg hover:border-black flex-shrink-0"
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
                    <Button onClick={handleAddLocation} disabled={!newLocName.trim()} size="sm">Add</Button>
                  </div>
                  {showLocIconPicker && (
                    <div className="flex flex-wrap gap-1 p-2 bg-white rounded-sm border border-steel">
                      {LOCATION_ICONS.map((ic) => (
                        <button
                          key={ic}
                          onClick={() => { setNewLocIcon(ic); setShowLocIconPicker(false); }}
                          className={`w-9 h-9 rounded-sm flex items-center justify-center text-lg hover:bg-steel ${newLocIcon === ic ? 'bg-steel' : ''}`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Location Input Style */}
            {entryFields.location && (
              <section>
                <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Location Input Style</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSettings({ locationStyle: 'buttons' })}
                    className={`flex-1 py-2 px-4 rounded-sm font-semibold transition-colors ${
                      settings.locationStyle === 'buttons' ? 'bg-black text-white' : 'bg-white text-charcoal border-2 border-steel hover:border-black'
                    }`}
                  >
                    Buttons
                  </button>
                  <button
                    onClick={() => updateSettings({ locationStyle: 'dropdown' })}
                    className={`flex-1 py-2 px-4 rounded-sm font-semibold transition-colors ${
                      settings.locationStyle === 'dropdown' ? 'bg-black text-white' : 'bg-white text-charcoal border-2 border-steel hover:border-black'
                    }`}
                  >
                    Dropdown
                  </button>
                </div>
              </section>
            )}

            {/* Auto Location */}
            {settings.version === 'trust' && (
              <section>
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
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Dashboard Settings</h2>
            <p className="text-sm text-slate">Customize what you see on your Dashboard.</p>

            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Widgets</h3>
              <div className="space-y-2">
                {[
                  { key: 'weather', label: 'Weather Widget', desc: 'Show current weather for your locations', icon: '🌤️' },
                  { key: 'streaks', label: 'Entry Streaks', desc: 'Track your daily entry streak', icon: '🔥' },
                  { key: 'insights', label: 'Weekly Insights', desc: 'Mood and activity summaries', icon: '📈' },
                  { key: 'recentSaved', label: 'Recent Saved Items', desc: 'Quick access to recently saved content', icon: '📥' },
                ].map((widget) => (
                  <label
                    key={widget.key}
                    className="flex items-center justify-between p-3 bg-concrete rounded-sm border border-steel cursor-pointer hover:border-charcoal transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{widget.icon}</span>
                      <div>
                        <span className="font-semibold text-black text-sm">{widget.label}</span>
                        <p className="text-xs text-slate">{widget.desc}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Timeline Settings</h2>
            <p className="text-sm text-slate">Control how entries are displayed on your Timeline.</p>

            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Display Options</h3>
              <div className="space-y-2">
                {[
                  { key: 'showLocation', label: 'Show Location', desc: 'Display location on each entry', icon: '📍' },
                  { key: 'showMood', label: 'Show Mood', desc: 'Display mood score on each entry', icon: '😊' },
                  { key: 'showActivities', label: 'Show Activities', desc: 'Display activity icons on entries', icon: '📝' },
                  { key: 'compactView', label: 'Compact View', desc: 'Use a condensed layout for entries', icon: '📐' },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center justify-between p-3 bg-concrete rounded-sm border border-steel cursor-pointer hover:border-charcoal transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{opt.icon}</span>
                      <div>
                        <span className="font-semibold text-black text-sm">{opt.label}</span>
                        <p className="text-xs text-slate">{opt.desc}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>
        );

      case 'lists':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Lists Settings</h2>
            <p className="text-sm text-slate">Choose which built-in lists are visible and their display order.</p>

            <section>
              <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Visible Lists</h3>
              <div className="space-y-2">
                {[
                  { key: 'grocery', label: 'Grocery List', icon: '🛒' },
                  { key: 'restaurants', label: 'Restaurants', icon: '🍽️' },
                  { key: 'watchlist', label: 'Watchlist', icon: '🎬' },
                  { key: 'reading', label: 'Reading List', icon: '📚' },
                  { key: 'music', label: 'Listen List', icon: '🎵' },
                  { key: 'places', label: 'Places to Visit', icon: '📍' },
                ].map((list) => (
                  <label
                    key={list.key}
                    className="flex items-center justify-between p-3 bg-concrete rounded-sm border border-steel cursor-pointer hover:border-charcoal transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{list.icon}</span>
                      <span className="font-semibold text-black text-sm">{list.label}</span>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Tools Settings</h2>
            <p className="text-sm text-slate">Configure Research, Voice Input, and Quick Share tools.</p>

            {/* Data Sources */}
            {settings.version === 'trust' && (
              <section>
                <h3 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Data Sources</h3>
                <div className="space-y-2">
                  {[
                    { key: 'gmail' as const, label: 'Gmail', desc: 'Scan emails for reservations', icon: '📧' },
                    { key: 'stripe' as const, label: 'Stripe', desc: 'Import transaction data', icon: '💳' },
                    { key: 'calendar' as const, label: 'Google Calendar', desc: 'Show calendar events', icon: '📅' },
                    { key: 'mapsTimeline' as const, label: 'Google Maps', desc: 'Location history', icon: '🗺️' },
                  ].map((api) => (
                    <label
                      key={api.key}
                      className="flex items-center justify-between p-3 bg-concrete rounded-sm border border-steel cursor-pointer hover:border-charcoal transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{api.icon}</span>
                        <div>
                          <span className="font-semibold text-black text-sm">{api.label}</span>
                          <p className="text-xs text-slate">{api.desc}</p>
                        </div>
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
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Notifications</h2>

            <section>
              <div className="bg-concrete rounded-sm p-4 border border-steel space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-black">Enable Notifications</span>
                    <p className="text-xs text-slate">Get reminders for events and daily entries</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.enabled}
                    onChange={(e) => updateSettings({ notifications: { ...settings.notifications, enabled: e.target.checked } })}
                    className="w-5 h-5 text-black rounded-sm border-2 border-black focus:ring-black"
                  />
                </label>

                {settings.notifications.enabled && (
                  <>
                    <div className="border-t border-steel pt-4">
                      <label className="block text-sm font-semibold text-black mb-2">Daily Reminder Time</label>
                      <input
                        type="time"
                        value={settings.notifications.time}
                        onChange={(e) => updateSettings({ notifications: { ...settings.notifications, time: e.target.value } })}
                        className="px-3 py-2 border-2 border-steel rounded-sm focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="border-t border-steel pt-4">
                      <p className="text-sm font-semibold text-black mb-2">Browser Permission</p>
                      <p className="text-xs text-slate mb-2">
                        Status: <strong>{notificationService.permission}</strong>
                      </p>
                      {notificationService.permission !== 'granted' && (
                        <Button variant="secondary" size="sm" onClick={handleRequestNotificationPermission}>
                          Enable Browser Notifications
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Account</h2>

            {user && (
              <section>
                <div className="bg-concrete rounded-sm p-4 border border-steel space-y-4">
                  <p className="text-small text-charcoal">
                    Signed in as <strong className="text-black">{user.email}</strong>
                  </p>

                  <div className="border-t border-steel pt-4">
                    <label className="block text-small font-semibold text-black mb-2">Phone Number (for list sharing)</label>
                    <p className="text-tiny text-slate mb-2">Add your phone number so others can share lists with you.</p>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                        className="flex-1 !mb-0"
                        maxLength={14}
                      />
                      <Button variant="secondary" onClick={handleSavePhone} disabled={savingPhone || !phone}>
                        {savingPhone ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-steel pt-4">
                    <Button variant="secondary" onClick={signOut}>Sign Out</Button>
                  </div>
                </div>
              </section>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-black">Data Management</h2>

            <section>
              <div className="bg-concrete rounded-sm p-4 border border-steel space-y-4">
                <div>
                  <p className="text-small text-slate mb-2">Export your entries for backup or analysis.</p>
                  <Button variant="secondary" onClick={handleExport} className="w-full">Export Data as CSV</Button>
                </div>
                <div className="border-t border-steel pt-4">
                  <p className="text-small text-slate mb-2">Import entries from local browser storage.</p>
                  <Button variant="secondary" onClick={handleImport} disabled={migrating} className="w-full">
                    {migrating ? 'Importing...' : 'Import from Local Storage'}
                  </Button>
                </div>
                <p className="text-tiny text-charcoal font-medium pt-2 border-t border-steel">
                  {entries.length} entries in your account
                </p>
              </div>
            </section>

            {/* Danger Zone */}
            <section>
              <h3 className="text-tiny font-semibold text-red-500 uppercase tracking-wider mb-3">Danger Zone</h3>
              <div className="bg-red-50 border-2 border-red-200 rounded-sm p-4">
                <p className="text-small text-charcoal mb-3">
                  This will permanently delete all your data. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button variant="danger" onClick={() => setShowClearConfirm(true)}>Clear All Data</Button>
                  <Button variant="secondary" onClick={() => resetSettings()}>Reset Settings</Button>
                </div>
              </div>
            </section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-black mb-6">Settings</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="hidden md:block w-48 flex-shrink-0">
          <div className="sticky top-20 space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`w-full text-left px-3 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeSection === section.id
                    ? 'bg-black text-white'
                    : 'text-charcoal hover:bg-concrete hover:text-black'
                }`}
              >
                <span>{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile section selector */}
        <div className="md:hidden w-full mb-4">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as SettingsSection)}
            className="w-full px-4 py-3 border-2 border-black rounded-sm text-sm font-semibold"
          >
            {SECTIONS.map((section) => (
              <option key={section.id} value={section.id}>
                {section.icon} {section.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>

      {/* Clear Confirm Modal */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Data?" size="sm">
        <p className="text-slate mb-4">Are you sure? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleClearData}>Yes, Clear Everything</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
