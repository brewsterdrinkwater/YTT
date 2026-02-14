import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import QuickShare from '../tools/QuickShare';

// This page handles PWA share target - when user shares from another app to Walt-Tab
const ShareTargetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get shared content from URL params (set by PWA share target)
    const url = searchParams.get('url');
    const text = searchParams.get('text');
    const title = searchParams.get('title');

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

  const handleComplete = () => {
    // After saving, navigate to saved items
    navigate('/saved');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-h2 font-bold text-black">Quick Share</h1>
        <p className="text-slate text-small mt-1">
          {sharedUrl ? 'Saving shared content...' : 'Paste or share content to save'}
        </p>
      </div>

      <div className="mb-4 p-4 bg-success/5 rounded-sm border-2 border-success/20">
        <h3 className="font-semibold text-black mb-1">Save to Walt-Tab</h3>
        <p className="text-small text-charcoal">
          Content will be analyzed and auto-categorized into your lists.
        </p>
      </div>

      <QuickShare initialUrl={sharedUrl || undefined} onComplete={handleComplete} />
    </div>
  );
};

export default ShareTargetPage;
