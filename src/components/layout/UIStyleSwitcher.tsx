import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { UIStyle } from '../../types/settings';
import { cn } from '../../utils/cn';

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
    <>
      {/* Trigger Button - More prominent on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
          'bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200',
          'border-2 border-purple-200 hover:border-purple-300',
          'text-purple-700 font-medium',
          'shadow-sm hover:shadow-md'
        )}
        aria-label="Change UI style"
      >
        <span className="text-xl">{currentStyle.icon}</span>
        <span className="text-sm">{currentStyle.label}</span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Modal/Sheet - Full screen on mobile, dropdown on desktop */}
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet on mobile, centered modal on desktop */}
          <div
            className={cn(
              'fixed z-50 bg-white overflow-hidden',
              // Mobile: bottom sheet
              'inset-x-0 bottom-0 rounded-t-3xl',
              // Desktop: centered modal
              'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
              'sm:rounded-2xl sm:w-80 sm:max-w-[90vw]',
              'shadow-2xl',
              'animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in duration-200'
            )}
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Choose Your Style</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Pick your preferred UI theme</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="p-4 space-y-3">
              {UI_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all',
                    settings.uiStyle === style.id
                      ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  )}
                >
                  <span className="text-3xl">{style.icon}</span>
                  <div className="flex-1">
                    <p className={cn(
                      'font-semibold',
                      settings.uiStyle === style.id ? 'text-purple-700' : 'text-gray-900'
                    )}>
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

            {/* Footer hint */}
            <div className="px-6 pb-6 pt-2">
              <p className="text-xs text-center text-gray-400">
                Your preference is saved automatically
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default UIStyleSwitcher;
