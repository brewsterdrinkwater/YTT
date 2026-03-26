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
    const url = searchParams.get('url');
    const text = searchParams.get('text');

    let extractedUrl = url;

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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-6">
      <div className="mb-4">
        <h1 className="text-h2 font-bold text-warm-800">Quick Share</h1>
        <p className="text-warm-500 text-small mt-1">
          {sharedUrl ? 'Analyzing shared content...' : 'Paste links or share from other apps'}
        </p>
      </div>

      {/* Quick links */}
      <div className="flex gap-2 mb-5">
        <Link
          to="/saved"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-white border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Saved Items
          {needsReviewCount > 0 && (
            <span className="bg-brand-coral text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {needsReviewCount}
            </span>
          )}
        </Link>
        <Link
          to="/tools"
          className="flex items-center justify-center gap-2 px-3 py-3 bg-white border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.655-5.655a1.5 1.5 0 010-2.12l.88-.88a1.5 1.5 0 012.12 0l5.655 5.656a1.5 1.5 0 010 2.12l-.88.88a1.5 1.5 0 01-2.12 0z" />
          </svg>
          Tools
        </Link>
      </div>

      <QuickShare initialUrl={sharedUrl || undefined} />
    </div>
  );
};

export default ShareTargetPage;
