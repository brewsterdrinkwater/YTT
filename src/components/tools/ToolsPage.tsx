import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { UIStyle } from '../../types/settings';
import { exportToCSV } from '../../utils/exportCSV';
import DeepResearchAgent from '../research/DeepResearchAgent';
import WebScraper from '../research/WebScraper';
import Card from '../common/Card';
import Button from '../common/Button';

type ToolTab = 'research' | 'scraper' | 'settings';

const UI_STYLES: { id: UIStyle; label: string; icon: string; description: string }[] = [
  { id: 'modern', label: 'Modern', icon: '✨', description: 'Swipe cards, glassmorphism' },
  { id: 'retro', label: 'Retro', icon: '👾', description: '8-bit, Oregon Trail style' },
  { id: 'structured', label: 'Structured', icon: '📋', description: 'Clean forms, colorful' },
];

const ToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('research');
  const { settings, updateSettings } = useSettings();
  const { entries } = useEntries();
  const { showToast } = useApp();

  const handleExport = () => {
    if (entries.length === 0) {
      showToast('No entries to export', 'warning');
      return;
    }
    exportToCSV(entries);
    showToast(`Exported ${entries.length} entries`, 'success');
  };

  const handleStyleChange = (style: UIStyle) => {
    updateSettings({ uiStyle: style });
    showToast(`Switched to ${style} theme`, 'success');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-gray-500 text-sm mt-1">Research, scrape content, and manage settings</p>
      </div>

      {/* Tool Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('research')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === 'research'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          <span className="text-lg">🧠</span>
          <span>Deep Research</span>
        </button>
        <button
          onClick={() => setActiveTab('scraper')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === 'scraper'
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          <span className="text-lg">🔗</span>
          <span>Web Scraper</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-green-100 text-green-700 border-2 border-green-200 shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          <span className="text-lg">⚙️</span>
          <span>Preferences</span>
        </button>
      </div>

      {/* Tool Content */}
      {activeTab === 'research' && (
        <div>
          <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-1">Deep Research Agent</h3>
            <p className="text-sm text-blue-600">
              Research artists, authors, actors, and more. Build lists of music to listen to,
              books to read, movies to watch, and places to visit.
            </p>
          </div>
          <DeepResearchAgent defaultExpanded />
        </div>
      )}

      {activeTab === 'scraper' && (
        <div>
          <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <h3 className="font-semibold text-purple-800 mb-1">Web Scraper</h3>
            <p className="text-sm text-purple-600">
              Paste a URL and automatically extract recipes (→ grocery list), restaurant
              recommendations, book lists, or movie recommendations.
            </p>
          </div>
          <WebScraper />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Theme Switcher */}
          <Card>
            <h3 className="font-semibold text-lg mb-1">App Theme</h3>
            <p className="text-sm text-gray-500 mb-4">Choose your preferred visual style</p>
            <div className="space-y-3">
              {UI_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                    settings.uiStyle === style.id
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <span className="text-3xl">{style.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      settings.uiStyle === style.id ? 'text-purple-700' : 'text-gray-900'
                    }`}>
                      {style.label}
                    </p>
                    <p className="text-sm text-gray-500">{style.description}</p>
                  </div>
                  {settings.uiStyle === style.id && (
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Export Data */}
          <Card>
            <h3 className="font-semibold text-lg mb-1">Export Data</h3>
            <p className="text-sm text-gray-500 mb-4">
              Download all your diary entries as a CSV file for backup or analysis.
            </p>
            <Button onClick={handleExport} variant="secondary" className="w-full">
              📥 Export {entries.length} Entries to CSV
            </Button>
          </Card>

          {/* Quick Links */}
          <Card className="bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">More Settings</h3>
            <p className="text-sm text-gray-500">
              For account settings, notifications, and data sources, use the settings icon in the header.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ToolsPage;
