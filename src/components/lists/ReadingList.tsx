import React, { useState, useEffect } from 'react';
import { ReadingListItem } from '../../types/research';
import { researchService } from '../../services/researchService';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

interface ReadingListProps {
  isFullPage?: boolean;
  onBack?: () => void;
}

const ReadingList: React.FC<ReadingListProps> = ({ isFullPage = false, onBack }) => {
  const { showToast } = useApp();
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', author: '' });
  const [isEnriching, setIsEnriching] = useState<string | null>(null);

  useEffect(() => {
    setReadingList(researchService.getReadingList());
  }, []);

  // Auto-enrich: Generate Kindle/Amazon search link
  const enrichWithKindle = async (name: string, author: string): Promise<string | null> => {
    try {
      const searchQuery = encodeURIComponent(`${name} ${author}`.trim());
      // Link to Amazon Kindle store search
      return `https://www.amazon.com/s?k=${searchQuery}&i=digital-text`;
    } catch {
      return null;
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;

    setIsEnriching(newItem.name);

    // Generate Kindle link
    const kindleUrl = await enrichWithKindle(newItem.name, newItem.author);

    const item: ReadingListItem = {
      name: newItem.name,
      works: newItem.author ? [newItem.author] : [],
      kindleUrl,
      addedAt: new Date().toISOString(),
    };

    const updated = researchService.addToReadingList(item);
    setReadingList(updated);
    setNewItem({ name: '', author: '' });
    setShowAddForm(false);
    setIsEnriching(null);
    showToast(`Added "${newItem.name}" to reading list`, 'success');
  };

  const handleRemove = (name: string) => {
    const updated = researchService.removeFromReadingList(name);
    setReadingList(updated);
    showToast(`Removed "${name}" from reading list`, 'info');
  };

  const containerClass = isFullPage ? 'min-h-screen bg-white' : '';

  return (
    <div className={containerClass}>
      {/* Header for full page mode */}
      {isFullPage && (
        <div className="sticky top-0 bg-white border-b-2 border-black z-10 px-4 py-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 hover:bg-concrete rounded-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                <span className="text-2xl">📚</span> Reading List
              </h1>
              {readingList.length > 0 && (
                <p className="text-sm text-slate">{readingList.length} books to read</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Card className={`${isFullPage ? 'border-0 shadow-none' : 'mb-4'} border-2 border-steel hover:border-charcoal transition-colors`}>
        {/* Header for embedded mode */}
        {!isFullPage && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-xl">📚</span> Reading List
              {readingList.length > 0 && (
                <span className="text-xs bg-tab-orange/20 text-tab-orange px-2 py-1 rounded-full font-semibold">
                  {readingList.length}
                </span>
              )}
            </h3>
          </div>
        )}

        {/* Item List */}
        {readingList.length === 0 ? (
          <p className="text-slate text-sm italic mb-4 py-8 text-center">
            No books yet. Add something to read!
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {readingList.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 p-4 bg-tab-orange/5 border-2 border-tab-orange/20 rounded-sm hover:border-tab-orange/40 transition-all"
              >
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <span className="text-base font-semibold text-black block">{item.name}</span>
                  {item.works && item.works.length > 0 && (
                    <span className="text-sm text-slate">by {item.works[0]}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {item.kindleUrl && (
                    <a
                      href={item.kindleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-4 flex items-center justify-center bg-tab-orange/10 text-tab-orange font-semibold text-sm rounded-sm hover:bg-tab-orange/20 transition-colors"
                    >
                      Kindle →
                    </a>
                  )}
                  <button
                    onClick={() => handleRemove(item.name)}
                    className="w-12 h-12 flex items-center justify-center text-slate hover:text-danger hover:bg-red-50 rounded-sm transition-colors"
                    title="Remove"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add Item Form */}
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="secondary"
            size="lg"
            className="w-full min-h-[56px] text-base"
          >
            + Add Book
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-concrete rounded-sm">
            <div className="flex gap-2">
              <Input
                placeholder="Book title"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="flex-1 !mb-0 text-base min-h-[52px]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                autoFocus
              />
              <button
                onClick={() => setShowAddForm(false)}
                className="w-12 h-12 flex items-center justify-center text-slate hover:text-black"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Input
              placeholder="Author (optional)"
              value={newItem.author}
              onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
              className="!mb-0 text-base min-h-[52px]"
            />

            <Button
              onClick={handleAddItem}
              variant="primary"
              size="lg"
              className="w-full min-h-[56px]"
              isLoading={isEnriching !== null}
            >
              {isEnriching ? 'Finding book...' : 'Add to Reading List'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReadingList;
