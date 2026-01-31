import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { UIStyle } from '../../types/settings';

const UI_STYLES: { id: UIStyle; label: string; icon: string; description: string }[] = [
  { id: 'modern', label: 'Modern', icon: '✨', description: 'Swipe cards, glassmorphism' },
  { id: 'retro', label: 'Retro', icon: '👾', description: '8-bit, Oregon Trail style' },
  { id: 'structured', label: 'Structured', icon: '📋', description: 'Clean forms, colorful' },
];

const UIStyleSwitcher: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const currentStyle = UI_STYLES.find((s) => s.id === settings.uiStyle) || UI_STYLES[2];

  const handleStyleChange = (style: UIStyle) => {
    updateSettings({ uiStyle: style });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Change UI style"
      >
        <span>{currentStyle.icon}</span>
        <span className="hidden sm:inline text-gray-700">{currentStyle.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden animate-fadeIn">
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">UI Style</p>
            </div>
            {UI_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  settings.uiStyle === style.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-xl">{style.icon}</span>
                <div>
                  <p className="font-medium text-sm">{style.label}</p>
                  <p className="text-xs text-gray-500">{style.description}</p>
                </div>
                {settings.uiStyle === style.id && (
                  <svg className="w-5 h-5 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UIStyleSwitcher;
