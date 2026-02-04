import React, { useState, useEffect } from 'react';
import { RestaurantItem } from '../../types/research';
import { researchService } from '../../services/researchService';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

interface RestaurantListProps {
  isFullPage?: boolean;
  onBack?: () => void;
}

const RestaurantList: React.FC<RestaurantListProps> = ({ isFullPage = false, onBack }) => {
  const { showToast } = useApp();
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '' });

  useEffect(() => {
    setRestaurants(researchService.getRestaurants());
  }, []);

  // Generate Google Maps link for restaurant
  const getGoogleMapsLink = (name: string, location?: string): string => {
    const searchQuery = encodeURIComponent(`${name} restaurant ${location || ''}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;

    const updated = researchService.addRestaurant({
      name: newItem.name,
      url: getGoogleMapsLink(newItem.name),
    });
    setRestaurants(updated);
    setNewItem({ name: '' });
    setShowAddForm(false);
    showToast(`Added "${newItem.name}" to restaurants`, 'success');
  };

  const handleToggleVisited = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    const updated = researchService.toggleRestaurantVisited(id);
    setRestaurants(updated);
    if (restaurant) {
      showToast(restaurant.visited ? `"${restaurant.name}" marked as not visited` : `"${restaurant.name}" marked as visited!`, 'success');
    }
  };

  const handleRemove = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    const updated = researchService.removeRestaurant(id);
    setRestaurants(updated);
    if (restaurant) {
      showToast(`Removed "${restaurant.name}"`, 'info');
    }
  };

  const unvisited = restaurants.filter((r) => !r.visited);
  const visited = restaurants.filter((r) => r.visited);

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
                <span className="text-2xl">🍽️</span> Restaurants
              </h1>
              {unvisited.length > 0 && (
                <p className="text-sm text-slate">{unvisited.length} to try</p>
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
              <span className="text-xl">🍽️</span> Restaurants
              {unvisited.length > 0 && (
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">
                  {unvisited.length} to try
                </span>
              )}
            </h3>
          </div>
        )}

        {/* Item List */}
        {restaurants.length === 0 ? (
          <p className="text-slate text-sm italic mb-4 py-8 text-center">
            No restaurants yet. Add places to try!
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {[...unvisited, ...visited].map((restaurant) => (
              <li
                key={restaurant.id}
                className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all ${
                  restaurant.visited
                    ? 'bg-concrete/50 border-steel opacity-60'
                    : 'bg-pink-50 border-pink-200 hover:border-pink-400'
                }`}
              >
                {/* Visited Checkbox - larger for touch */}
                <button
                  onClick={() => handleToggleVisited(restaurant.id)}
                  className={`w-10 h-10 min-w-[40px] rounded-full border-3 flex items-center justify-center transition-all ${
                    restaurant.visited
                      ? 'bg-success border-success text-white'
                      : 'border-steel hover:border-success'
                  }`}
                >
                  {restaurant.visited && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <span className={`text-base font-semibold block ${restaurant.visited ? 'line-through text-slate' : 'text-black'}`}>
                    {restaurant.name}
                  </span>
                  {restaurant.cuisine && (
                    <span className="text-sm text-slate">{restaurant.cuisine}</span>
                  )}
                  {restaurant.location && (
                    <span className="text-sm text-slate block">{restaurant.location}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <a
                    href={restaurant.url || getGoogleMapsLink(restaurant.name, restaurant.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-4 flex items-center justify-center bg-pink-100 text-pink-700 font-semibold text-sm rounded-sm hover:bg-pink-200 transition-colors"
                  >
                    Maps →
                  </a>
                  <button
                    onClick={() => handleRemove(restaurant.id)}
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
            + Add Restaurant
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-concrete rounded-sm">
            <div className="flex gap-2">
              <Input
                placeholder="Restaurant name"
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

            <Button onClick={handleAddItem} variant="primary" size="lg" className="w-full min-h-[56px]">
              Add Restaurant
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RestaurantList;
