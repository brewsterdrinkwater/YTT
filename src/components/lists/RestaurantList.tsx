import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantItem } from '../../types/research';
import { useLists } from '../../contexts/ListsContext';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';
import { searchRestaurant } from '../../services/googleMapsService';
import { API_CONFIG } from '../../constants/config';

interface RestaurantListProps {
  isFullPage?: boolean;
  onBack?: () => void;
}

const PRICE_OPTIONS = [1, 2, 3, 4] as const;
const PRICE_LABEL = (n: number) => '$'.repeat(n);

type CityOption = 'nashville' | 'nyc' | '';

const emptyForm = {
  name: '',
  city: '' as CityOption,
  cuisine: '',
  neighborhood: '',
  priceRange: '' as '' | 1 | 2 | 3 | 4,
  notes: '',
  requiresReservation: false,
  resyUrl: '',
  openTableUrl: '',
  googleMapsUrl: '',
};

const RestaurantList: React.FC<RestaurantListProps> = ({ isFullPage = false, onBack }) => {
  const { showToast } = useApp();
  const {
    restaurantsList: restaurants,
    addRestaurant,
    updateRestaurant,
    toggleRestaurantVisited,
    removeRestaurant,
  } = useLists();

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [showArchived, setShowArchived] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const hasApiKey = !!API_CONFIG.GOOGLE_MAPS_API_KEY;

  const handleLookup = async (f: typeof emptyForm, setF: (v: typeof emptyForm) => void) => {
    if (!f.name.trim()) return;
    setLookupLoading(true);
    try {
      const result = await searchRestaurant(f.name.trim(), f.neighborhood.trim() || undefined);
      if (result) {
        setF({
          ...f,
          neighborhood: result.neighborhood || f.neighborhood,
          priceRange: result.priceLevel ?? f.priceRange,
          cuisine: result.primaryCuisine || f.cuisine,
          googleMapsUrl: result.googleMapsUri || f.googleMapsUrl,
        });
        showToast('Found on Google Maps — fields updated!', 'success');
      } else {
        showToast('Not found — fill in manually', 'info');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const active = restaurants.filter((r) => (r.status || 'active') === 'active');
  const archived = restaurants.filter((r) => r.status === 'archived');
  const unvisited = active.filter((r) => !r.visited);
  const visited = active.filter((r) => r.visited);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addRestaurant({
      name: form.name.trim(),
      city: form.city || undefined,
      cuisine: form.cuisine.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      priceRange: form.priceRange || undefined,
      notes: form.notes.trim() || undefined,
      requiresReservation: form.requiresReservation || undefined,
      resyUrl: form.resyUrl.trim() || undefined,
      openTableUrl: form.openTableUrl.trim() || undefined,
      googleMapsUrl:
        form.googleMapsUrl.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.name)}`,
      status: 'active',
      source: 'manual',
    });
    setForm(emptyForm);
    setShowAddForm(false);
    showToast(`Added "${form.name}"`, 'success');
  };

  const startEdit = (r: RestaurantItem) => {
    setEditingId(r.id);
    setEditForm({
      name: r.name,
      city: (r.city as CityOption) || '',
      cuisine: r.cuisine || '',
      neighborhood: r.neighborhood || '',
      priceRange: r.priceRange || '',
      notes: r.notes || '',
      requiresReservation: r.requiresReservation || false,
      resyUrl: r.resyUrl || '',
      openTableUrl: r.openTableUrl || '',
      googleMapsUrl: r.googleMapsUrl || '',
    });
  };

  const saveEdit = () => {
    if (!editingId || !editForm.name.trim()) return;
    updateRestaurant(editingId, {
      name: editForm.name.trim(),
      city: editForm.city || undefined,
      cuisine: editForm.cuisine.trim() || undefined,
      neighborhood: editForm.neighborhood.trim() || undefined,
      priceRange: editForm.priceRange || undefined,
      notes: editForm.notes.trim() || undefined,
      requiresReservation: editForm.requiresReservation || undefined,
      resyUrl: editForm.resyUrl.trim() || undefined,
      openTableUrl: editForm.openTableUrl.trim() || undefined,
      googleMapsUrl: editForm.googleMapsUrl.trim() || undefined,
    });
    setEditingId(null);
    showToast('Updated', 'success');
  };

  const handleArchive = (r: RestaurantItem) => {
    updateRestaurant(r.id, { status: 'archived' });
    showToast(`"${r.name}" archived`, 'info');
  };

  const handleRestore = (r: RestaurantItem) => {
    updateRestaurant(r.id, { status: 'active' });
    showToast(`"${r.name}" restored`, 'success');
  };

  const handleToggleVisited = (r: RestaurantItem) => {
    toggleRestaurantVisited(r.id);
    showToast(r.visited ? `Unmarked visited` : `"${r.name}" visited!`, 'success');
  };

  const RestaurantForm = ({
    values,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    values: typeof emptyForm;
    onChange: (v: typeof emptyForm) => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
  }) => (
    <div className="space-y-3 p-4 bg-concrete rounded-lg border-2 border-black">
      {/* Name + optional Maps lookup */}
      <div className="flex gap-2">
        <Input
          placeholder="Restaurant name *"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          className="!mb-0 flex-1"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        {hasApiKey && (
          <button
            type="button"
            onClick={() => handleLookup(values, onChange)}
            disabled={!values.name.trim() || lookupLoading}
            className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-600 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40 shrink-0 whitespace-nowrap"
            title="Look up on Google Maps to auto-fill details"
          >
            {lookupLoading ? '…' : '🗺 Look up'}
          </button>
        )}
      </div>

      {/* City */}
      <div>
        <p className="text-xs text-slate mb-1.5 font-medium">City</p>
        <div className="flex gap-2">
          {([['nashville', '🎸 Nashville'], ['nyc', '🗽 NYC'], ['', 'Other']] as [CityOption, string][]).map(
            ([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ ...values, city: val })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${
                  values.city === val
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-concrete'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Cuisine (e.g. Italian)"
          value={values.cuisine}
          onChange={(e) => onChange({ ...values, cuisine: e.target.value })}
          className="!mb-0"
        />
        <Input
          placeholder="Neighborhood"
          value={values.neighborhood}
          onChange={(e) => onChange({ ...values, neighborhood: e.target.value })}
          className="!mb-0"
        />
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs text-slate mb-1.5 font-medium">Price range</p>
        <div className="flex gap-2">
          {PRICE_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                onChange({ ...values, priceRange: values.priceRange === p ? '' : p })
              }
              className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-colors ${
                values.priceRange === p
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black hover:bg-concrete'
              }`}
            >
              {PRICE_LABEL(p)}
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="Notes (parking, favorite dish…)"
        value={values.notes}
        onChange={(e) => onChange({ ...values, notes: e.target.value })}
        className="!mb-0"
      />

      {/* Reservation toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={values.requiresReservation}
          onChange={(e) => onChange({ ...values, requiresReservation: e.target.checked })}
          className="w-4 h-4 accent-black"
        />
        <span className="text-sm text-black">Requires reservation</span>
      </label>

      {/* Optional links */}
      <details className="group">
        <summary className="text-xs text-slate cursor-pointer hover:text-black select-none">
          Booking links (optional)
        </summary>
        <div className="mt-2 space-y-2">
          <Input
            placeholder="Google Maps URL"
            value={values.googleMapsUrl}
            onChange={(e) => onChange({ ...values, googleMapsUrl: e.target.value })}
            className="!mb-0 text-xs"
          />
          <Input
            placeholder="Resy URL"
            value={values.resyUrl}
            onChange={(e) => onChange({ ...values, resyUrl: e.target.value })}
            className="!mb-0 text-xs"
          />
          <Input
            placeholder="OpenTable URL"
            value={values.openTableUrl}
            onChange={(e) => onChange({ ...values, openTableUrl: e.target.value })}
            className="!mb-0 text-xs"
          />
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        <Button onClick={onSubmit} variant="primary" size="md" className="flex-1">
          {submitLabel}
        </Button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate hover:text-black border-2 border-steel rounded-lg text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const RestaurantRow: React.FC<{ r: RestaurantItem; archived?: boolean }> = ({
    r,
    archived: isArchived,
  }) => (
    <AnimatePresence mode="wait">
      {editingId === r.id ? (
        <motion.li
          key="edit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <RestaurantForm
            values={editForm}
            onChange={setEditForm}
            onSubmit={saveEdit}
            onCancel={() => setEditingId(null)}
            submitLabel="Save changes"
          />
        </motion.li>
      ) : (
        <motion.li
          key="row"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
            isArchived
              ? 'bg-concrete/40 border-concrete opacity-60'
              : r.visited
              ? 'bg-concrete/50 border-steel opacity-70'
              : 'bg-white border-steel hover:border-charcoal'
          }`}
        >
          {/* Visited checkbox (not shown for archived) */}
          {!isArchived && (
            <button
              onClick={() => handleToggleVisited(r)}
              className={`mt-0.5 w-8 h-8 min-w-[32px] rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                r.visited
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-steel hover:border-green-400'
              }`}
            >
              {r.visited && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${r.visited ? 'line-through text-slate' : 'text-black'}`}>
              {r.name}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {r.city === 'nashville' && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  🎸 Nashville
                </span>
              )}
              {r.city === 'nyc' && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  🗽 NYC
                </span>
              )}
              {r.cuisine && (
                <span className="text-xs bg-concrete text-charcoal px-2 py-0.5 rounded-full">
                  {r.cuisine}
                </span>
              )}
              {r.priceRange && (
                <span className="text-xs bg-concrete text-charcoal px-2 py-0.5 rounded-full">
                  {PRICE_LABEL(r.priceRange)}
                </span>
              )}
              {r.neighborhood && (
                <span className="text-xs bg-concrete text-charcoal px-2 py-0.5 rounded-full">
                  {r.neighborhood}
                </span>
              )}
              {r.requiresReservation && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Reservation
                </span>
              )}
            </div>
            {r.notes && <p className="text-xs text-slate mt-1 italic">{r.notes}</p>}
            {r.lastVisited && (
              <p className="text-xs text-slate mt-1">
                Last visited{' '}
                {new Date(r.lastVisited).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1 shrink-0">
            {/* Maps link */}
            <a
              href={
                r.googleMapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 flex items-center justify-center bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
            >
              Maps
            </a>
            {/* Edit */}
            {!isArchived && (
              <button
                onClick={() => startEdit(r)}
                className="h-8 px-3 flex items-center justify-center bg-concrete text-charcoal text-xs font-semibold rounded-lg hover:bg-steel transition-colors"
              >
                Edit
              </button>
            )}
            {/* Archive / Restore */}
            {!isArchived ? (
              <button
                onClick={() => handleArchive(r)}
                className="h-8 px-3 flex items-center justify-center text-slate text-xs hover:text-black rounded-lg hover:bg-concrete transition-colors"
                title="Archive (remove from deck without deleting)"
              >
                Archive
              </button>
            ) : (
              <button
                onClick={() => handleRestore(r)}
                className="h-8 px-3 flex items-center justify-center text-slate text-xs hover:text-black rounded-lg hover:bg-concrete transition-colors"
              >
                Restore
              </button>
            )}
            {/* Delete */}
            <button
              onClick={() => {
                removeRestaurant(r.id);
                showToast(`Removed "${r.name}"`, 'info');
              }}
              className="h-8 w-8 flex items-center justify-center text-slate hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.li>
      )}
    </AnimatePresence>
  );

  return (
    <div className={isFullPage ? 'min-h-screen bg-white' : ''}>
      {/* Full-page header */}
      {isFullPage && (
        <div className="sticky top-0 bg-white border-b-2 border-black z-10 px-4 py-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 hover:bg-concrete rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                <span>🍽️</span> Restaurants
              </h1>
              <p className="text-xs text-slate">
                {unvisited.length} to try · {visited.length} visited
              </p>
            </div>
          </div>
        </div>
      )}

      <Card
        className={`${isFullPage ? 'border-0 shadow-none rounded-none' : 'mb-4 border-2 border-steel hover:border-charcoal transition-colors'}`}
      >
        {/* Embedded header */}
        {!isFullPage && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>🍽️</span> Restaurants
              {unvisited.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                  {unvisited.length} to try
                </span>
              )}
            </h3>
          </div>
        )}

        {/* Unvisited */}
        {unvisited.length === 0 && visited.length === 0 && archived.length === 0 ? (
          <p className="text-slate text-sm italic py-8 text-center">
            No restaurants yet — add your first spot!
          </p>
        ) : (
          <ul className="space-y-2 mb-3">
            {[...unvisited, ...visited].map((r) => (
              <RestaurantRow key={r.id} r={r} />
            ))}
          </ul>
        )}

        {/* Archived section */}
        {archived.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate hover:text-black mb-2"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showArchived ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {archived.length} archived
            </button>
            {showArchived && (
              <ul className="space-y-2 mb-3">
                {archived.map((r) => (
                  <RestaurantRow key={r.id} r={r} archived />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Add form */}
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="secondary"
            size="lg"
            className="w-full min-h-[52px] text-sm"
          >
            + Add Restaurant
          </Button>
        ) : (
          <RestaurantForm
            values={form}
            onChange={setForm}
            onSubmit={handleAdd}
            onCancel={() => {
              setShowAddForm(false);
              setForm(emptyForm);
            }}
            submitLabel="Add Restaurant"
          />
        )}
      </Card>
    </div>
  );
};

export default RestaurantList;
