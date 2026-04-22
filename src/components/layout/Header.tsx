import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import VaultIcon from '../VaultIcon';

const Header: React.FC = () => {
  const { setIsSettingsOpen } = useApp();
  const { settings } = useSettings();
  const { user } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-warm-200 sticky top-0 z-40 safe-area-top">
      <div className="max-w-content mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div style={{ color: 'var(--color-vault-accent)' }}>
            <VaultIcon size={28} />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-vault-text)' }}>
            Valt-Tab
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User email - desktop only */}
          {user && (
            <span className="text-tiny text-warm-500 hidden md:inline truncate max-w-[150px]">
              {user.email}
            </span>
          )}

          {/* Version badge */}
          <span
            className={`text-tiny px-2.5 py-1 rounded-full hidden sm:inline font-medium ${
              settings.version === 'trust'
                ? 'bg-brand-coral/10 text-brand-coral'
                : 'bg-warm-100 text-warm-600 border border-warm-200'
            }`}
          >
            {settings.version === 'trust' ? 'Trust' : 'Secure'}
          </span>

          {/* Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-warm-500 hover:text-warm-800 hover:bg-warm-100 rounded-xl transition-all duration-fast"
            aria-label="Open settings"
          >
            <svg
              className="w-5 h-5"
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
