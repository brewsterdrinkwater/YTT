import React, { useState, useEffect } from 'react';
import { SpotifyListItem } from '../../types/research';
import { researchService } from '../../services/researchService';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

interface MusicListProps {
  isFullPage?: boolean;
  onBack?: () => void;
}

const MusicList: React.FC<MusicListProps> = ({ isFullPage = false, onBack }) => {
  const { showToast } = useApp();
  const [musicList, setMusicList] = useState<SpotifyListItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', notes: '' });
  const [isEnriching, setIsEnriching] = useState<string | null>(null);

  useEffect(() => {
    setMusicList(researchService.getSpotifyList());
  }, []);

  // Auto-enrich: Generate Spotify search link
  const enrichWithSpotify = async (name: string): Promise<string | null> => {
    try {
      const searchQuery = encodeURIComponent(name);
      return `https://open.spotify.com/search/${searchQuery}`;
    } catch {
      return null;
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;

    setIsEnriching(newItem.name);

    // Generate Spotify link
    const spotifyUrl = await enrichWithSpotify(newItem.name);

    const item: SpotifyListItem = {
      name: newItem.name,
      spotifyUrl,
      addedAt: new Date().toISOString(),
    };

    const updated = researchService.addToSpotifyList(item);
    setMusicList(updated);
    setNewItem({ name: '', notes: '' });
    setShowAddForm(false);
    setIsEnriching(null);
    showToast(`Added "${newItem.name}" to listen list`, 'success');
  };

  const handleRemove = (name: string) => {
    const updated = researchService.removeFromSpotifyList(name);
    setMusicList(updated);
    showToast(`Removed "${name}" from listen list`, 'info');
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
                <span className="text-2xl">🎵</span> Listen List
              </h1>
              {musicList.length > 0 && (
                <p className="text-sm text-slate">{musicList.length} to listen to</p>
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
              <span className="text-xl">🎵</span> Listen List
              {musicList.length > 0 && (
                <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-semibold">
                  {musicList.length}
                </span>
              )}
            </h3>
          </div>
        )}

        {/* Item List */}
        {musicList.length === 0 ? (
          <p className="text-slate text-sm italic mb-4 py-8 text-center">
            No music yet. Add artists, albums, or songs!
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {musicList.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 p-4 bg-success/5 border-2 border-success/20 rounded-sm hover:border-success/40 transition-all"
              >
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <span className="text-base font-semibold text-black block">{item.name}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {item.spotifyUrl && (
                    <a
                      href={item.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-4 flex items-center justify-center bg-success/10 text-success font-semibold text-sm rounded-sm hover:bg-success/20 transition-colors"
                    >
                      Spotify →
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
            + Add Music
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-concrete rounded-sm">
            <div className="flex gap-2">
              <Input
                placeholder="Artist, album, or song"
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

            <Button
              onClick={handleAddItem}
              variant="primary"
              size="lg"
              className="w-full min-h-[56px]"
              isLoading={isEnriching !== null}
            >
              {isEnriching ? 'Finding on Spotify...' : 'Add to Listen List'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MusicList;
