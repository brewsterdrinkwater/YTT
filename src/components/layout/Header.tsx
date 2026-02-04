import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Walt-tab Header Component
 * Brutalist style: Clean white background, black text, minimal decoration
 */
const Header: React.FC = () => {
  const { setIsSettingsOpen } = useApp();
  const { settings } = useSettings();
  const { user } = useAuth();

  return (
    <header className="bg-white border-b-2 border-black sticky top-0 z-40">
      <div className="max-w-content mx-auto px-md h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {/* Placeholder for Uncle Walter pixelated portrait */}
          <div className="w-10 h-10 bg-black rounded-sm flex items-center justify-center">
            <span className="text-white text-xl font-bold">W</span>
          </div>
          <span className="text-h3 font-bold text-black tracking-tight">
            Walt-Tab
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* User email */}
          {user && (
            <span className="text-tiny text-slate hidden md:inline truncate max-w-[150px]">
              {user.email}
            </span>
          )}

          {/* Version badge */}
          <span
            className={`text-tiny px-3 py-1 rounded-sm hidden sm:inline font-medium ${
              settings.version === 'trust'
                ? 'bg-black text-white'
                : 'bg-concrete text-charcoal border border-steel'
            }`}
          >
            {settings.version === 'trust' ? 'Trust' : 'Secure'}
          </span>

          {/* Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-charcoal hover:text-black hover:bg-concrete rounded-sm transition-colors duration-fast"
            aria-label="Open settings"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
