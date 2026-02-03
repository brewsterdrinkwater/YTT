import React, { useState } from 'react';
import DeepResearchAgent from '../research/DeepResearchAgent';
import WebScraper from '../research/WebScraper';

type ToolTab = 'research' | 'scraper';

const ToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('research');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-gray-500 text-sm mt-1">Research people and scrape content from the web</p>
      </div>

      {/* Tool Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('research')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'scraper'
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          <span className="text-lg">🔗</span>
          <span>Web Scraper</span>
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
    </div>
  );
};

export default ToolsPage;
