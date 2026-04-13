import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { setIsSettingsOpen } = useApp();
  const { settings } = useSettings();
  const { user } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-warm-200 sticky top-0 z-40 safe-area-top">
      <div className="max-w-content mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-coral rounded-xl flex items-center justify-center shadow-glow-coral">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Vault door outer ring */}
              <circle cx="11" cy="11" r="9.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
              {/* Inner groove */}
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              {/* Wheel spokes */}
              <line x1="11" y1="5.5" x2="11" y2="16.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="5.5" y1="11" x2="16.5" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              {/* Center hub */}
              <circle cx="11" cy="11" r="2.2" fill="white"/>
              <circle cx="11" cy="11" r="0.9" fill="rgba(255,107,107,0.8)"/>
              {/* Rivets */}
              <circle cx="11" cy="2" r="0.9" fill="rgba(255,255,255,0.6)"/>
              <circle cx="20" cy="11" r="0.9" fill="rgba(255,255,255,0.6)"/>
              <circle cx="11" cy="20" r="0.9" fill="rgba(255,255,255,0.6)"/>
              <circle cx="2" cy="11" r="0.9" fill="rgba(255,255,255,0.6)"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-warm-800 tracking-tight">
            Valt-tab
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
