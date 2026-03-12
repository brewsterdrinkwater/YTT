import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';

interface LocationManagerProps {
  onClose: () => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ onClose }) => {
  const {
    locations,
    items,
    addLocation,
    updateLocation,
    removeLocation,
    addZone,
    updateZone,
    removeZone,
    addSpot,
    updateSpot,
    removeSpot,
  } = useInventory();

  const [newLocationName, setNewLocationName] = useState('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [newZoneInputs, setNewZoneInputs] = useState<Record<string, string>>({});
  const [newSpotInputs, setNewSpotInputs] = useState<Record<string, string>>({});
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(locations.map((l) => l.id))
  );
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; parentId?: string; grandparentId?: string } | null>(null);

  const toggleExpanded = (id: string, set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    const loc = addLocation(newLocationName.trim());
    setNewLocationName('');
    setExpandedLocations((prev) => new Set(prev).add(loc.id));
  };

  const handleAddZone = (locationId: string) => {
    const name = newZoneInputs[locationId]?.trim();
    if (!name) return;
    addZone(locationId, name);
    setNewZoneInputs((prev) => ({ ...prev, [locationId]: '' }));
  };

  const handleAddSpot = (locationId: string, zoneId: string) => {
    const key = `${locationId}-${zoneId}`;
    const name = newSpotInputs[key]?.trim();
    if (!name) return;
    addSpot(locationId, zoneId, name);
    setNewSpotInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const getItemCount = (locationId: string, zoneId?: string, spotId?: string): number => {
    return items.filter((i) => {
      if (i.locationId !== locationId) return false;
      if (zoneId && i.zoneId !== zoneId) return false;
      if (spotId && i.spotId !== spotId) return false;
      return true;
    }).length;
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    const { type, id, parentId, grandparentId } = deleteConfirm;
    if (type === 'location') removeLocation(id);
    else if (type === 'zone' && parentId) removeZone(parentId, id);
    else if (type === 'spot' && parentId && grandparentId) removeSpot(grandparentId, parentId, id);
    setDeleteConfirm(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-black w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="text-body font-bold text-black">Manage Locations</h2>
          <button onClick={onClose} className="text-slate hover:text-black p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="text-tiny text-slate mb-4">
            Organize your inventory with up to 3 levels: Location → Room/Zone → Specific Spot
          </p>

          {/* Add new location */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Add new location (e.g., NYC Apartment)..."
              className="flex-1 px-3 py-2 border-2 border-black text-small focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
            />
            <button
              onClick={handleAddLocation}
              disabled={!newLocationName.trim()}
              className="px-4 py-2 text-small border-2 border-black bg-black text-white font-semibold hover:bg-charcoal transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {/* Locations list */}
          {locations.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-steel">
              <div className="text-3xl mb-2">📍</div>
              <p className="text-small text-slate">No locations yet. Add one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((loc) => {
                const isExpanded = expandedLocations.has(loc.id);
                const itemCount = getItemCount(loc.id);

                return (
                  <div key={loc.id} className="border-2 border-black">
                    {/* Location header */}
                    <div className="flex items-center gap-2 p-3 bg-concrete">
                      <button
                        onClick={() => toggleExpanded(loc.id, expandedLocations, setExpandedLocations)}
                        className="text-black"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {editingLocationId === loc.id ? (
                        <input
                          type="text"
                          value={editLocationName}
                          onChange={(e) => setEditLocationName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-black text-small focus:outline-none"
                          autoFocus
                          onBlur={() => {
                            if (editLocationName.trim()) updateLocation(loc.id, editLocationName.trim());
                            setEditingLocationId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editLocationName.trim()) updateLocation(loc.id, editLocationName.trim());
                              setEditingLocationId(null);
                            }
                          }}
                        />
                      ) : (
                        <span className="flex-1 font-semibold text-small text-black">
                          📍 {loc.name}
                        </span>
                      )}

                      <span className="text-tiny text-slate">{itemCount} items</span>
                      <button
                        onClick={() => {
                          setEditingLocationId(loc.id);
                          setEditLocationName(loc.name);
                        }}
                        className="p-1 text-slate hover:text-black"
                        title="Rename"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'location', id: loc.id })}
                        className="p-1 text-slate hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Zones */}
                    {isExpanded && (
                      <div className="p-3 space-y-2">
                        {loc.zones.map((zone) => {
                          const zoneExpanded = expandedZones.has(zone.id);
                          const zoneCount = getItemCount(loc.id, zone.id);

                          return (
                            <div key={zone.id} className="ml-4 border border-steel">
                              <div className="flex items-center gap-2 p-2 bg-white">
                                <button
                                  onClick={() => toggleExpanded(zone.id, expandedZones, setExpandedZones)}
                                  className="text-slate"
                                >
                                  <svg
                                    className={`w-3.5 h-3.5 transition-transform ${zoneExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                <span className="flex-1 text-small font-medium">{zone.name}</span>
                                <span className="text-tiny text-slate">{zoneCount}</span>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'zone', id: zone.id, parentId: loc.id })}
                                  className="p-0.5 text-slate hover:text-red-600"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              {/* Spots */}
                              {zoneExpanded && (
                                <div className="px-2 pb-2 space-y-1">
                                  {zone.spots.map((spot) => (
                                    <div key={spot.id} className="flex items-center gap-2 ml-4 py-1">
                                      <span className="text-tiny text-slate">→</span>
                                      <span className="flex-1 text-tiny font-medium">{spot.name}</span>
                                      <span className="text-tiny text-slate">{getItemCount(loc.id, zone.id, spot.id)}</span>
                                      <button
                                        onClick={() => setDeleteConfirm({ type: 'spot', id: spot.id, parentId: zone.id, grandparentId: loc.id })}
                                        className="p-0.5 text-slate hover:text-red-600"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                  {/* Add spot */}
                                  <div className="flex gap-1 ml-4 mt-1">
                                    <input
                                      type="text"
                                      value={newSpotInputs[`${loc.id}-${zone.id}`] ?? ''}
                                      onChange={(e) =>
                                        setNewSpotInputs((prev) => ({
                                          ...prev,
                                          [`${loc.id}-${zone.id}`]: e.target.value,
                                        }))
                                      }
                                      placeholder="Add spot..."
                                      className="flex-1 px-2 py-1 border border-steel text-tiny focus:outline-none focus:border-black"
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddSpot(loc.id, zone.id)}
                                    />
                                    <button
                                      onClick={() => handleAddSpot(loc.id, zone.id)}
                                      className="px-2 py-1 text-tiny border border-black bg-black text-white font-medium"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add zone */}
                        <div className="flex gap-1 ml-4">
                          <input
                            type="text"
                            value={newZoneInputs[loc.id] ?? ''}
                            onChange={(e) =>
                              setNewZoneInputs((prev) => ({ ...prev, [loc.id]: e.target.value }))
                            }
                            placeholder="Add room/zone..."
                            className="flex-1 px-2 py-1.5 border border-steel text-tiny focus:outline-none focus:border-black"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddZone(loc.id)}
                          />
                          <button
                            onClick={() => handleAddZone(loc.id)}
                            className="px-3 py-1.5 text-tiny border border-black bg-black text-white font-medium"
                          >
                            + Room
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-small border-2 border-black bg-black text-white font-semibold hover:bg-charcoal transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white border-2 border-black p-6 max-w-sm w-full">
            <h3 className="text-body font-bold text-black mb-2">
              Delete {deleteConfirm.type}?
            </h3>
            <p className="text-slate text-small mb-4">
              This will also remove all items stored in this {deleteConfirm.type}. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-small border-2 border-steel bg-white text-black font-medium hover:border-black"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-small border-2 border-red-600 bg-red-600 text-white font-semibold hover:bg-red-700"
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

export default LocationManager;
