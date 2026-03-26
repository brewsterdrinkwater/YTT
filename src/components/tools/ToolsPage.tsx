import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeepResearchAgent from '../research/DeepResearchAgent';
import QuickShare from './QuickShare';
import VoiceInput from './VoiceInput';

type ToolTab = 'share' | 'voice' | 'research';

const ToolsPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Default to share on mobile (the primary use case), research on desktop
  const [activeTab, setActiveTab] = useState<ToolTab>('share');

  useEffect(() => {
    if (!isMobile) {
      setActiveTab('share');
    }
  }, [isMobile]);

  const tabs: { key: ToolTab; label: string; icon: string; color: string; mobileOnly?: boolean }[] = [
    { key: 'share', label: 'Quick Share', icon: '📥', color: 'bg-brand-coral/10 text-brand-coral border-brand-coral' },
    { key: 'voice', label: 'Voice', icon: '🎤', color: 'bg-brand-sunset/10 text-brand-sunset border-brand-sunset', mobileOnly: true },
    { key: 'research', label: 'Research', icon: '🧠', color: 'bg-brand-ocean/10 text-brand-ocean border-brand-ocean' },
  ];

  const filteredTabs = isMobile ? tabs : tabs.filter(t => !t.mobileOnly);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-6">
      {/* Header with quick links */}
      <div className="mb-5">
        <h1 className="text-h2 font-bold text-warm-800">Tools</h1>
        <p className="text-warm-500 text-small mt-1">Share, research, and organize content</p>
      </div>

      {/* Quick access cards on mobile */}
      {isMobile && (
        <div className="flex gap-2 mb-5">
          <Link
            to="/saved"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-white border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            Saved Items
          </Link>
          <Link
            to="/timeline"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-white border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timeline
          </Link>
        </div>
      )}

      {/* Tool Tabs - pill style */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {filteredTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap border-2 ${
              activeTab === tab.key
                ? tab.color
                : 'bg-white text-warm-500 border-warm-200 hover:border-warm-300 hover:text-warm-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tool Content */}
      {activeTab === 'share' && (
        <div>
          <div className="mb-4 p-4 bg-gradient-to-r from-brand-coral/5 to-brand-sunset/5 rounded-2xl border border-brand-coral/10">
            <h3 className="font-bold text-warm-800 mb-1">Quick Share</h3>
            <p className="text-small text-warm-600">
              Share links from Instagram, YouTube, and more. AI analyzes content and adds items to your lists or Google Maps.
            </p>
          </div>
          <QuickShare />
        </div>
      )}

      {activeTab === 'voice' && isMobile && (
        <div>
          <div className="mb-4 p-4 bg-gradient-to-r from-brand-sunset/5 to-brand-peach/20 rounded-2xl border border-brand-sunset/10">
            <h3 className="font-bold text-warm-800 mb-1">Voice Input</h3>
            <p className="text-small text-warm-600">
              Use your voice to quickly add items to any list. Just say "Add eggs to groceries"
              or "Add The Office to watchlist".
            </p>
          </div>
          <VoiceInput />
        </div>
      )}

      {activeTab === 'research' && (
        <div>
          <div className="mb-4 p-4 bg-gradient-to-r from-brand-ocean/5 to-brand-sky/10 rounded-2xl border border-brand-ocean/10">
            <h3 className="font-bold text-warm-800 mb-1">Deep Research Agent</h3>
            <p className="text-small text-warm-600">
              Research artists, authors, actors, and more. Build lists of music, books, movies, and places.
            </p>
          </div>
          <DeepResearchAgent defaultExpanded />
        </div>
      )}
    </div>
  );
};

export default ToolsPage;
