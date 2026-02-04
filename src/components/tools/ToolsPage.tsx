import React, { useState } from 'react';
import DeepResearchAgent from '../research/DeepResearchAgent';
import WebScraper from '../research/WebScraper';
import VoiceInput from './VoiceInput';

type ToolTab = 'voice' | 'research' | 'scraper';

const ToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('voice');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-h2 font-bold text-black">Tools</h1>
        <p className="text-slate text-small mt-1">Voice input, research, and web scraping</p>
      </div>

      {/* Tool Tabs - Walt-tab brutalist style */}
      <div className="flex gap-1 mb-6 border-b-2 border-black overflow-x-auto">
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 whitespace-nowrap ${
            activeTab === 'voice'
              ? 'bg-tab-orange/10 text-black border-tab-orange'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          <span>🎤</span>
          <span>Voice Input</span>
        </button>
        <button
          onClick={() => setActiveTab('research')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 whitespace-nowrap ${
            activeTab === 'research'
              ? 'bg-tab-blue/10 text-black border-tab-blue'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          <span>🧠</span>
          <span>Deep Research</span>
        </button>
        <button
          onClick={() => setActiveTab('scraper')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 whitespace-nowrap ${
            activeTab === 'scraper'
              ? 'bg-success/10 text-black border-success'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          <span>🔗</span>
          <span>Web Scraper</span>
        </button>
      </div>

      {/* Tool Content */}
      {activeTab === 'voice' && (
        <div>
          <div className="mb-4 p-4 bg-tab-orange/5 rounded-sm border-2 border-tab-orange/20">
            <h3 className="font-semibold text-black mb-1">Voice Input</h3>
            <p className="text-small text-charcoal">
              Use your voice to quickly add items to any list. Just say "Add eggs to groceries"
              or "Add The Office to watchlist" and it will be added automatically.
            </p>
          </div>
          <VoiceInput />
        </div>
      )}

      {activeTab === 'research' && (
        <div>
          <div className="mb-4 p-4 bg-tab-blue/5 rounded-sm border-2 border-tab-blue/20">
            <h3 className="font-semibold text-black mb-1">Deep Research Agent</h3>
            <p className="text-small text-charcoal">
              Research artists, authors, actors, and more. Build lists of music to listen to,
              books to read, movies to watch, and places to visit.
            </p>
          </div>
          <DeepResearchAgent defaultExpanded />
        </div>
      )}

      {activeTab === 'scraper' && (
        <div>
          <div className="mb-4 p-4 bg-success/5 rounded-sm border-2 border-success/20">
            <h3 className="font-semibold text-black mb-1">Web Scraper</h3>
            <p className="text-small text-charcoal">
              Paste a URL and automatically extract recipes (→ grocery list), restaurant
              recommendations, book lists, or movie recommendations.
            </p>
          </div>
          <WebScraper />
        </div>
      )}
    </div>
  );
};

export default ToolsPage;
