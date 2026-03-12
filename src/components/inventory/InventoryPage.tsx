import React, { useState, useMemo } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { INVENTORY_CATEGORIES, InventoryCategory } from '../../types/inventory';
import AddItemModal from './AddItemModal';
import ItemCard from './ItemCard';
import LocationManager from './LocationManager';

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'category' | 'location';

const InventoryPage: React.FC = () => {
  const { items, locations, getLocationPath, removeItem } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.notes.toLowerCase().includes(q) ||
          getLocationPath(i.locationId, i.zoneId, i.spotId).toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterMode === 'category' && selectedCategory) {
      result = result.filter((i) => i.category === selectedCategory);
    }

    // Location filter
    if (filterMode === 'location' && selectedLocationId) {
      result = result.filter((i) => {
        if (i.locationId !== selectedLocationId) return false;
        if (selectedZoneId && i.zoneId !== selectedZoneId) return false;
        if (selectedSpotId && i.spotId !== selectedSpotId) return false;
        return true;
      });
    }

    return result;
  }, [items, searchQuery, filterMode, selectedCategory, selectedLocationId, selectedZoneId, selectedSpotId, getLocationPath]);

  // Category counts for filter pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Location counts
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.locationId] = (counts[i.locationId] || 0) + 1;
    });
    return counts;
  }, [items]);

  const handleEdit = (id: string) => {
    setEditItemId(id);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      removeItem(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditItemId(null);
  };

  const clearFilters = () => {
    setFilterMode('all');
    setSelectedCategory(null);
    setSelectedLocationId(null);
    setSelectedZoneId(null);
    setSelectedSpotId(null);
    setSearchQuery('');
  };

  // Location breadcrumb for location filter
  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const selectedZone = selectedLocation?.zones.find((z) => z.id === selectedZoneId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-black">Inventory</h1>
            <p className="text-slate text-small mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} across {locations.length} location{locations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLocationManager(true)}
              className="px-3 py-2 text-small border-2 border-black bg-white text-black font-semibold hover:bg-concrete transition-colors"
            >
              Locations
            </button>
            <button
              onClick={() => { setEditItemId(null); setShowAddModal(true); }}
              className="px-4 py-2 text-small border-2 border-black bg-black text-white font-semibold hover:bg-charcoal transition-colors"
            >
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items, locations, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-black text-small focus:outline-none focus:ring-0 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-black"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap items-center">
        <button
          onClick={() => { setFilterMode('all'); setSelectedCategory(null); setSelectedLocationId(null); }}
          className={`px-3 py-1.5 text-tiny font-semibold border-2 transition-colors ${
            filterMode === 'all'
              ? 'border-black bg-black text-white'
              : 'border-steel bg-white text-slate hover:border-black hover:text-black'
          }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => { setFilterMode('category'); setSelectedLocationId(null); }}
          className={`px-3 py-1.5 text-tiny font-semibold border-2 transition-colors ${
            filterMode === 'category'
              ? 'border-black bg-black text-white'
              : 'border-steel bg-white text-slate hover:border-black hover:text-black'
          }`}
        >
          By Category
        </button>
        <button
          onClick={() => { setFilterMode('location'); setSelectedCategory(null); }}
          className={`px-3 py-1.5 text-tiny font-semibold border-2 transition-colors ${
            filterMode === 'location'
              ? 'border-black bg-black text-white'
              : 'border-steel bg-white text-slate hover:border-black hover:text-black'
          }`}
        >
          By Location
        </button>

        {/* View toggle */}
        <div className="ml-auto flex border-2 border-steel">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-slate hover:text-black'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-slate hover:text-black'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category pills */}
      {filterMode === 'category' && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {(Object.entries(INVENTORY_CATEGORIES) as [InventoryCategory, typeof INVENTORY_CATEGORIES[InventoryCategory]][]).map(
            ([key, cat]) => {
              const count = categoryCounts[key] || 0;
              if (count === 0 && selectedCategory !== key) return null;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={`px-3 py-1.5 text-tiny font-medium border rounded-full transition-colors flex items-center gap-1.5 ${
                    selectedCategory === key
                      ? cat.color + ' border-current font-semibold'
                      : 'border-steel bg-white text-slate hover:border-black'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="opacity-60">({count})</span>
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Location pills / breadcrumbs */}
      {filterMode === 'location' && (
        <div className="mb-4">
          {/* Location tier 1 */}
          <div className="flex gap-2 flex-wrap mb-2">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  if (selectedLocationId === loc.id) {
                    setSelectedLocationId(null);
                    setSelectedZoneId(null);
                    setSelectedSpotId(null);
                  } else {
                    setSelectedLocationId(loc.id);
                    setSelectedZoneId(null);
                    setSelectedSpotId(null);
                  }
                }}
                className={`px-3 py-1.5 text-tiny font-medium border-2 transition-colors flex items-center gap-1.5 ${
                  selectedLocationId === loc.id
                    ? 'border-black bg-black text-white font-semibold'
                    : 'border-steel bg-white text-slate hover:border-black hover:text-black'
                }`}
              >
                <span>📍</span>
                <span>{loc.name}</span>
                <span className="opacity-60">({locationCounts[loc.id] || 0})</span>
              </button>
            ))}
          </div>

          {/* Zone tier 2 */}
          {selectedLocation && selectedLocation.zones.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2 ml-4">
              <span className="text-slate text-tiny self-center">→</span>
              {selectedLocation.zones.map((zone) => {
                const zoneCount = items.filter(
                  (i) => i.locationId === selectedLocationId && i.zoneId === zone.id
                ).length;
                return (
                  <button
                    key={zone.id}
                    onClick={() => {
                      if (selectedZoneId === zone.id) {
                        setSelectedZoneId(null);
                        setSelectedSpotId(null);
                      } else {
                        setSelectedZoneId(zone.id);
                        setSelectedSpotId(null);
                      }
                    }}
                    className={`px-3 py-1.5 text-tiny font-medium border rounded-full transition-colors flex items-center gap-1.5 ${
                      selectedZoneId === zone.id
                        ? 'border-black bg-charcoal text-white font-semibold'
                        : 'border-steel bg-concrete text-slate hover:border-black hover:text-black'
                    }`}
                  >
                    <span>{zone.name}</span>
                    <span className="opacity-60">({zoneCount})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Spot tier 3 */}
          {selectedZone && selectedZone.spots.length > 0 && (
            <div className="flex gap-2 flex-wrap ml-8">
              <span className="text-slate text-tiny self-center">→</span>
              {selectedZone.spots.map((spot) => {
                const spotCount = items.filter(
                  (i) =>
                    i.locationId === selectedLocationId &&
                    i.zoneId === selectedZoneId &&
                    i.spotId === spot.id
                ).length;
                return (
                  <button
                    key={spot.id}
                    onClick={() =>
                      setSelectedSpotId(selectedSpotId === spot.id ? null : spot.id)
                    }
                    className={`px-2.5 py-1 text-tiny font-medium border rounded-full transition-colors flex items-center gap-1 ${
                      selectedSpotId === spot.id
                        ? 'border-black bg-slate text-white font-semibold'
                        : 'border-steel bg-white text-slate hover:border-black hover:text-black'
                    }`}
                  >
                    <span>{spot.name}</span>
                    <span className="opacity-60">({spotCount})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active filter indicator */}
      {(filterMode !== 'all' || searchQuery) && (
        <div className="mb-4 flex items-center gap-2 text-tiny text-slate">
          <span>
            Showing {filteredItems.length} of {items.length} items
          </span>
          <button onClick={clearFilters} className="text-black underline hover:no-underline font-medium">
            Clear all filters
          </button>
        </div>
      )}

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-steel">
          {items.length === 0 ? (
            <>
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-body font-semibold text-black mb-2">No items yet</h3>
              <p className="text-slate text-small mb-4">
                {locations.length === 0
                  ? 'Start by adding a location, then add items to track.'
                  : 'Add your first item to start tracking your inventory.'}
              </p>
              {locations.length === 0 ? (
                <button
                  onClick={() => setShowLocationManager(true)}
                  className="px-4 py-2 text-small border-2 border-black bg-black text-white font-semibold hover:bg-charcoal transition-colors"
                >
                  Add a Location
                </button>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 text-small border-2 border-black bg-black text-white font-semibold hover:bg-charcoal transition-colors"
                >
                  + Add First Item
                </button>
              )}
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-body font-semibold text-black mb-2">No matches</h3>
              <p className="text-slate text-small">Try adjusting your search or filters.</p>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              viewMode="grid"
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              viewMode="list"
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddItemModal
          editItemId={editItemId}
          onClose={handleCloseModal}
        />
      )}

      {/* Location Manager */}
      {showLocationManager && (
        <LocationManager onClose={() => setShowLocationManager(false)} />
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black p-6 max-w-sm w-full">
            <h3 className="text-body font-bold text-black mb-2">Delete item?</h3>
            <p className="text-slate text-small mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-small border-2 border-steel bg-white text-black font-medium hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-small border-2 border-red-600 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
