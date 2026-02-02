import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useSettings } from '../../contexts/SettingsContext';
import Card from '../common/Card';

const VersionSelector: React.FC = () => {
  const { setOnboardingComplete } = useApp();
  const { setVersion } = useSettings();

  const handleSelect = (version: 'trust' | 'secure') => {
    setVersion(version);
    setOnboardingComplete(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to Walt-Tab
          </h1>
          <p className="text-xl text-gray-600">Your personal life dashboard</p>
          <p className="text-gray-500 mt-4">
            Track your life, your way. Choose how you want to use Walt-Tab.
          </p>
        </div>

        {/* Version Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Trust Mode */}
          <Card
            className="hover:border-primary border-2 border-transparent transition-all cursor-pointer group"
            onClick={() => handleSelect('trust')}
            hover
          >
            <div className="text-center">
              <span className="text-5xl mb-4 block">🤖</span>
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                "I Trust You Bro"
              </h2>
              <p className="text-sm text-gray-500 mb-4">Automated convenience</p>

              <ul className="text-left text-sm space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Auto-detect location via GPS/WiFi
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sync with Google Calendar
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Parse Gmail for activities
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Import Stripe transactions
                </li>
              </ul>
            </div>
          </Card>

          {/* Secure Mode */}
          <Card
            className="hover:border-secondary border-2 border-transparent transition-all cursor-pointer group"
            onClick={() => handleSelect('secure')}
            hover
          >
            <div className="text-center">
              <span className="text-5xl mb-4 block">🔒</span>
              <h2 className="text-xl font-bold mb-2 group-hover:text-secondary transition-colors">
                "Secure & Private"
              </h2>
              <p className="text-sm text-gray-500 mb-4">Complete privacy control</p>

              <ul className="text-left text-sm space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  All data stored locally
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  No external API connections
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Manual entry for full control
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Export anytime as CSV
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-400">
          Don't worry, you can change this later in Settings
        </p>
      </div>
    </div>
  );
};

export default VersionSelector;
