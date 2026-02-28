import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import QuickShare from '../tools/QuickShare';
import { useLists } from '../../contexts/ListsContext';

// This page handles PWA share target AND serves as the primary share hub
const ShareTargetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const { savedItems } = useLists();
  const needsReviewCount = savedItems.filter((i) => i.needsUserInput).length;

  useEffect(() => {
    // Get shared content from URL params (set by PWA share target)
    const url = searchParams.get('url');
    const text = searchParams.get('text');

    // Try to extract URL from params
    let extractedUrl = url;

    // If no direct URL, try to find URL in text
    if (!extractedUrl && text) {
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        extractedUrl = urlMatch[0];
      }
    }

    if (extractedUrl) {
      setSharedUrl(extractedUrl);
    }
  }, [searchParams]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-4">
        <h1 className="text-h2 font-bold text-black">Quick Share</h1>
        <p className="text-slate text-small mt-1">
          {sharedUrl ? 'Saving shared content...' : 'Paste links or share from other apps'}
        </p>
      </div>

      {/* Quick links to Saved Items and Tools */}
      <div className="flex gap-2 mb-4">
        <Link
          to="/saved"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-black rounded-sm text-sm font-semibold hover:bg-concrete transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Saved Items
          {needsReviewCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {needsReviewCount}
            </span>
          )}
        </Link>
        <Link
          to="/tools"
          className="flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-concrete rounded-sm text-sm font-semibold text-slate hover:border-black hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a2 2 0 002.5 2.5l3.276-3.276c.256.565.398 1.192.398 1.852z" />
          </svg>
          Tools
        </Link>
      </div>

      <QuickShare initialUrl={sharedUrl || undefined} />
    </div>
  );
};

export default ShareTargetPage;
