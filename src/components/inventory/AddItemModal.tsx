import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import {
  INVENTORY_CATEGORIES,
  InventoryCategory,
  InventoryItem,
} from '../../types/inventory';

interface AddItemModalProps {
  editItemId: string | null;
  onClose: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ editItemId, onClose }) => {
  const {
    items,
    locations,
    addItem,
    updateItem,
    addLocation,
    addZone,
    addSpot,
  } = useInventory();

  const existingItem = editItemId ? items.find((i) => i.id === editItemId) : null;
  const isEditing = !!existingItem;

  // Form state
  const [name, setName] = useState(existingItem?.name ?? '');
  const [description, setDescription] = useState(existingItem?.description ?? '');
  const [category, setCategory] = useState<InventoryCategory>(existingItem?.category ?? 'other');
  const [locationId, setLocationId] = useState(existingItem?.locationId ?? '');
  const [zoneId, setZoneId] = useState(existingItem?.zoneId ?? '');
  const [spotId, setSpotId] = useState(existingItem?.spotId ?? '');
  const [imageUrl, setImageUrl] = useState(existingItem?.imageUrl ?? '');
  const [productUrl, setProductUrl] = useState(existingItem?.productUrl ?? '');
  const [tags, setTags] = useState(existingItem?.tags.join(', ') ?? '');
  const [quantity, setQuantity] = useState(existingItem?.quantity ?? 1);
  const [estimatedValue, setEstimatedValue] = useState(existingItem?.estimatedValue?.toString() ?? '');
  const [notes, setNotes] = useState(existingItem?.notes ?? '');

  // New location/zone/spot inline creation
  const [newLocationName, setNewLocationName] = useState('');
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [showNewZone, setShowNewZone] = useState(false);
  const [newSpotName, setNewSpotName] = useState('');
  const [showNewSpot, setShowNewSpot] = useState(false);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLocation = locations.find((l) => l.id === locationId);
  const selectedZone = selectedLocation?.zones.find((z) => z.id === zoneId);

  // Auto-select first location if only one exists
  useEffect(() => {
    if (!locationId && locations.length === 1) {
      setLocationId(locations[0].id);
    }
  }, [locationId, locations]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateLocation = () => {
    if (!newLocationName.trim()) return;
    const loc = addLocation(newLocationName.trim());
    setLocationId(loc.id);
    setNewLocationName('');
    setShowNewLocation(false);
  };

  const handleCreateZone = () => {
    if (!newZoneName.trim() || !locationId) return;
    addZone(locationId, newZoneName.trim());
    setNewZoneName('');
    setShowNewZone(false);
    // The zone ID will be available after re-render; find it from updated locations
    setTimeout(() => {
      const updatedLoc = locations.find((l) => l.id === locationId);
      if (updatedLoc) {
        const newZone = updatedLoc.zones.find((z) => z.name === newZoneName.trim());
        if (newZone) setZoneId(newZone.id);
      }
    }, 50);
  };

  const handleCreateSpot = () => {
    if (!newSpotName.trim() || !locationId || !zoneId) return;
    addSpot(locationId, zoneId, newSpotName.trim());
    setNewSpotName('');
    setShowNewSpot(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !locationId) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const itemData = {
      name: name.trim(),
      description: description.trim(),
      category,
      locationId,
      zoneId: zoneId || null,
      spotId: spotId || null,
      imageUrl: imageUrl || null,
      productUrl: productUrl || null,
      tags: parsedTags,
      quantity,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
      notes: notes.trim(),
    };

    if (isEditing && editItemId) {
      updateItem(editItemId, itemData);
    } else {
      addItem(itemData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-2 border-black w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="text-body font-bold text-black">
            {isEditing ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose} className="text-slate hover:text-black p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Navy Blue Suit, MacBook Pro..."
              className="w-full px-3 py-2 border-2 border-black text-small focus:outline-none"
              autoFocus
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(INVENTORY_CATEGORIES) as [InventoryCategory, typeof INVENTORY_CATEGORIES[InventoryCategory]][]).map(
                ([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`px-2.5 py-1 text-tiny border rounded-full transition-colors flex items-center gap-1 ${
                      category === key
                        ? cat.color + ' border-current font-semibold'
                        : 'border-steel bg-white text-slate hover:border-black'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Location (Tier 1) */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">
              Location *
            </label>
            {locations.length === 0 && !showNewLocation ? (
              <button
                type="button"
                onClick={() => setShowNewLocation(true)}
                className="w-full px-3 py-2 border-2 border-dashed border-steel text-small text-slate hover:border-black hover:text-black transition-colors text-left"
              >
                + Add your first location (e.g., "NYC Apartment")
              </button>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setLocationId(loc.id);
                      setZoneId('');
                      setSpotId('');
                    }}
                    className={`px-3 py-1.5 text-tiny font-medium border-2 transition-colors ${
                      locationId === loc.id
                        ? 'border-black bg-black text-white'
                        : 'border-steel bg-white text-slate hover:border-black hover:text-black'
                    }`}
                  >
                    📍 {loc.name}
                  </button>
                ))}
                {!showNewLocation && (
                  <button
                    type="button"
                    onClick={() => setShowNewLocation(true)}
                    className="px-3 py-1.5 text-tiny font-medium border-2 border-dashed border-steel text-slate hover:border-black hover:text-black transition-colors"
                  >
                    + New
                  </button>
                )}
              </div>
            )}
            {showNewLocation && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Location name..."
                  className="flex-1 px-3 py-1.5 border-2 border-black text-small focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateLocation())}
                />
                <button
                  type="button"
                  onClick={handleCreateLocation}
                  className="px-3 py-1.5 text-tiny border-2 border-black bg-black text-white font-semibold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewLocation(false)}
                  className="px-2 py-1.5 text-tiny border-2 border-steel text-slate"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Zone (Tier 2) */}
          {locationId && selectedLocation && (
            <div>
              <label className="block text-tiny font-semibold text-black mb-1">
                Room / Zone <span className="font-normal text-slate">(optional)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {selectedLocation.zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      setZoneId(zoneId === zone.id ? '' : zone.id);
                      setSpotId('');
                    }}
                    className={`px-2.5 py-1 text-tiny font-medium border rounded-full transition-colors ${
                      zoneId === zone.id
                        ? 'border-black bg-charcoal text-white'
                        : 'border-steel bg-concrete text-slate hover:border-black hover:text-black'
                    }`}
                  >
                    {zone.name}
                  </button>
                ))}
                {!showNewZone && (
                  <button
                    type="button"
                    onClick={() => setShowNewZone(true)}
                    className="px-2.5 py-1 text-tiny font-medium border border-dashed border-steel text-slate hover:border-black hover:text-black rounded-full transition-colors"
                  >
                    + Add Room
                  </button>
                )}
              </div>
              {showNewZone && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="e.g., Bedroom, Garage..."
                    className="flex-1 px-3 py-1.5 border-2 border-black text-small focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateZone())}
                  />
                  <button type="button" onClick={handleCreateZone} className="px-3 py-1.5 text-tiny border-2 border-black bg-black text-white font-semibold">
                    Add
                  </button>
                  <button type="button" onClick={() => setShowNewZone(false)} className="px-2 py-1.5 text-tiny border-2 border-steel text-slate">
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Spot (Tier 3) */}
          {zoneId && selectedZone && (
            <div>
              <label className="block text-tiny font-semibold text-black mb-1">
                Specific Spot <span className="font-normal text-slate">(optional)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {selectedZone.spots.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => setSpotId(spotId === spot.id ? '' : spot.id)}
                    className={`px-2.5 py-1 text-tiny font-medium border rounded-full transition-colors ${
                      spotId === spot.id
                        ? 'border-black bg-slate text-white'
                        : 'border-steel bg-white text-slate hover:border-black hover:text-black'
                    }`}
                  >
                    {spot.name}
                  </button>
                ))}
                {!showNewSpot && (
                  <button
                    type="button"
                    onClick={() => setShowNewSpot(true)}
                    className="px-2.5 py-1 text-tiny font-medium border border-dashed border-steel text-slate hover:border-black hover:text-black rounded-full transition-colors"
                  >
                    + Add Spot
                  </button>
                )}
              </div>
              {showNewSpot && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSpotName}
                    onChange={(e) => setNewSpotName(e.target.value)}
                    placeholder="e.g., Closet shelf, Box #3..."
                    className="flex-1 px-3 py-1.5 border-2 border-black text-small focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSpot())}
                  />
                  <button type="button" onClick={handleCreateSpot} className="px-3 py-1.5 text-tiny border-2 border-black bg-black text-white font-semibold">
                    Add
                  </button>
                  <button type="button" onClick={() => setShowNewSpot(false)} className="px-2 py-1.5 text-tiny border-2 border-steel text-slate">
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">
              Photo <span className="font-normal text-slate">(optional)</span>
            </label>
            <div className="flex gap-3 items-start">
              {imageUrl ? (
                <div className="relative w-20 h-20 border-2 border-black flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt="Item"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-tiny"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-steel flex items-center justify-center text-slate hover:border-black hover:text-black transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="w-full px-3 py-1.5 border-2 border-steel text-tiny focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-tiny text-slate underline hover:text-black"
                >
                  Or upload from device
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Product URL */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">
              Product Link <span className="font-normal text-slate">(optional)</span>
            </label>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border-2 border-steel text-small focus:outline-none focus:border-black"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">
              Description <span className="font-normal text-slate">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full px-3 py-2 border-2 border-steel text-small focus:outline-none focus:border-black"
            />
          </div>

          {/* Tags, Quantity, Value row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-tiny font-semibold text-black mb-1">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full px-3 py-2 border-2 border-steel text-small focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-tiny font-semibold text-black mb-1">
                Est. Value <span className="font-normal text-slate">($)</span>
              </label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0.00"
                min={0}
                step="0.01"
                className="w-full px-3 py-2 border-2 border-steel text-small focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">
              Tags <span className="font-normal text-slate">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., designer, vintage, gift..."
              className="w-full px-3 py-2 border-2 border-steel text-small focus:outline-none focus:border-black"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-tiny font-semibold text-black mb-1">
              Notes <span className="font-normal text-slate">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border-2 border-steel text-small focus:outline-none focus:border-black resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t border-steel">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-small border-2 border-steel bg-white text-black font-medium hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !locationId}
              className="px-6 py-2 text-small border-2 border-black bg-black text-white font-semibold hover:bg-charcoal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
