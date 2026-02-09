import React, { useState, useEffect } from 'react';
import { PlacesListItem } from '../../types/research';
import { researchService } from '../../services/researchService';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input, TextArea } from '../common/Input';

interface PlacesListProps {
  isFullPage?: boolean;
  onBack?: () => void;
}

const PlacesList: React.FC<PlacesListProps> = ({ isFullPage = false, onBack }) => {
  const { showToast } = useApp();
  const [placesList, setPlacesList] = useState<PlacesListItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', location: '', reason: '' });

  useEffect(() => {
    setPlacesList(researchService.getPlacesList());
  }, []);

  // Generate Google Maps link
  const getGoogleMapsLink = (name: string, location: string): string => {
    const searchQuery = encodeURIComponent(`${name} ${location}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;

    const item: PlacesListItem = {
      name: newItem.name,
      location: newItem.location || null,
      reason: newItem.reason || 'Want to visit',
      visited: false,
      addedAt: new Date().toISOString(),
    };

    const updated = researchService.addToPlacesList(item);
    setPlacesList(updated);
    setNewItem({ name: '', location: '', reason: '' });
    setShowAddForm(false);
    showToast(`Added "${newItem.name}" to places list`, 'success');
  };

  const handleRemove = (name: string) => {
    const updated = researchService.removeFromPlacesList(name);
    setPlacesList(updated);
    showToast(`Removed "${name}" from places list`, 'info');
  };

  const handleToggleVisited = (name: string) => {
    const updated = researchService.togglePlaceVisited(name);
    setPlacesList(updated);
    const place = updated.find(p => p.name === name);
    showToast(`Marked "${name}" as ${place?.visited ? 'visited' : 'to visit'}`, 'success');
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
                <span className="text-2xl">📍</span> Places to Visit
              </h1>
              {placesList.length > 0 && (
                <p className="text-sm text-slate">{placesList.length} places saved</p>
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
              <span className="text-xl">📍</span> Places to Visit
              {placesList.length > 0 && (
                <span className="text-xs bg-tab-blue/20 text-tab-blue px-2 py-1 rounded-full font-semibold">
                  {placesList.length}
                </span>
              )}
            </h3>
          </div>
        )}

        {/* Item List */}
        {placesList.length === 0 ? (
          <p className="text-slate text-sm italic mb-4 py-8 text-center">
            No places yet. Add destinations to visit!
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {placesList.map((item, i) => (
              <li
                key={i}
                className={`flex items-start gap-3 p-4 border-2 rounded-sm transition-all ${
                  item.visited
                    ? 'bg-success/10 border-success/30 hover:border-success/50'
                    : 'bg-tab-blue/5 border-tab-blue/20 hover:border-tab-blue/40'
                }`}
              >
                {/* Visited Toggle */}
                <button
                  onClick={() => handleToggleVisited(item.name)}
                  className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-sm transition-all ${
                    item.visited
                      ? 'bg-success text-white'
                      : 'bg-concrete text-slate hover:bg-tab-blue/20 hover:text-tab-blue'
                  }`}
                  title={item.visited ? 'Mark as not visited' : 'Mark as visited'}
                >
                  {item.visited ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <span className={`text-base font-semibold block ${item.visited ? 'text-success line-through' : 'text-black'}`}>
                    {item.name}
                  </span>
                  {item.location && (
                    <span className="text-sm text-slate">{item.location}</span>
                  )}
                  {item.reason && (
                    <p className={`text-sm mt-1 ${item.visited ? 'text-success/70' : 'text-tab-blue'}`}>{item.reason}</p>
                  )}
                  {item.visited && (
                    <span className="inline-block mt-1 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-semibold">
                      Visited
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <a
                    href={getGoogleMapsLink(item.name, item.location || '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-4 flex items-center justify-center bg-tab-blue/10 text-tab-blue font-semibold text-sm rounded-sm hover:bg-tab-blue/20 transition-colors"
                  >
                    Maps →
                  </a>
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
            + Add Place
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-concrete rounded-sm">
            <div className="flex gap-2">
              <Input
                placeholder="Place name"
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
              placeholder="Location (city, country)"
              value={newItem.location}
              onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              className="!mb-0 text-base min-h-[52px]"
            />

            <TextArea
              placeholder="Why do you want to visit?"
              value={newItem.reason}
              onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
              className="!mb-0 text-base"
              rows={2}
            />

            <Button onClick={handleAddItem} variant="primary" size="lg" className="w-full min-h-[56px]">
              Add to Places List
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlacesList;
