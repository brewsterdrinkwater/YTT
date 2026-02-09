import React, { useState, useEffect } from 'react';
import { GroceryItem, GroceryStore } from '../../types/research';
import { researchService } from '../../services/researchService';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import { ShareListModal } from '../sharing';

// Store options for the dropdown
const STORE_OPTIONS: { value: GroceryStore; label: string }[] = [
  { value: '', label: 'Any Store' },
  { value: 'whole-foods', label: 'Whole Foods' },
  { value: 'trader-joes', label: "Trader Joe's" },
  { value: 'corner-store', label: 'Corner Store' },
  { value: 'kroger', label: 'Kroger' },
  { value: 'specialty', label: 'Specialty' },
];

// Get store display name
const getStoreName = (store: GroceryStore | undefined): string => {
  if (!store) return '';
  const option = STORE_OPTIONS.find(o => o.value === store);
  return option?.label || '';
};

// Get store badge color
const getStoreColor = (store: GroceryStore | undefined): string => {
  switch (store) {
    case 'whole-foods': return 'bg-green-100 text-green-700';
    case 'trader-joes': return 'bg-red-100 text-red-700';
    case 'corner-store': return 'bg-blue-100 text-blue-700';
    case 'kroger': return 'bg-purple-100 text-purple-700';
    case 'specialty': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

interface GroceryListProps {
  isFullPage?: boolean;
  onBack?: () => void;
}

const GroceryList: React.FC<GroceryListProps> = ({ isFullPage = false, onBack }) => {
  const { showToast } = useApp();
  const { user } = useAuth();
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [atTheStore, setAtTheStore] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: '', store: '' as GroceryStore });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStore, setFilterStore] = useState<GroceryStore | 'all'>('all');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    setGroceryList(researchService.getGroceryList());
  }, []);

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;
    const updated = researchService.addGroceryItem({
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      isStaple: false,
      store: newItem.store,
    });
    setGroceryList(updated);
    setNewItem({ name: '', quantity: 1, unit: '', store: '' });
    setShowAddForm(false);
    showToast(`Added "${newItem.name}" to grocery list`, 'success');
  };

  const handleToggle = (id: string) => {
    const updated = researchService.toggleGroceryItem(id);
    setGroceryList(updated);
  };

  const handleRemove = (id: string) => {
    const item = groceryList.find(g => g.id === id);
    const updated = researchService.removeGroceryItem(id);
    setGroceryList(updated);
    if (item) {
      showToast(`Removed "${item.name}"`, 'info');
    }
  };

  const handleToggleStaple = (id: string) => {
    const item = groceryList.find((g) => g.id === id);
    if (item) {
      const updated = researchService.updateGroceryItem(id, { isStaple: !item.isStaple });
      setGroceryList(updated);
      showToast(item.isStaple ? `"${item.name}" removed from staples` : `"${item.name}" marked as staple`, 'success');
    }
  };

  const handleSetStore = (id: string, store: GroceryStore) => {
    const updated = researchService.updateGroceryItem(id, { store });
    setGroceryList(updated);
  };

  const handleStartShopping = () => {
    // Add all staple items if not already present and reset their checked status
    const staples = groceryList.filter(item => item.isStaple);
    let updated = groceryList.map(item =>
      item.isStaple ? { ...item, checked: false } : item
    );
    researchService.saveGroceryList(updated);
    setGroceryList(updated);
    setAtTheStore(true);
    showToast('Shopping mode activated! Staple items are ready.', 'success');
  };

  const handleStoreRunComplete = () => {
    // Remove all checked non-staple items, reset staple items to unchecked
    const updated = researchService.clearCheckedGroceryItems();
    setGroceryList(updated);
    setAtTheStore(false);
    showToast('Store run complete! List cleared for next time.', 'success');
  };

  // Filter items by store if filter is active
  const filteredList = filterStore === 'all'
    ? groceryList
    : groceryList.filter(item => item.store === filterStore || !item.store);

  const uncheckedCount = filteredList.filter((g) => !g.checked).length;
  const checkedCount = filteredList.filter((g) => g.checked).length;
  const stapleCount = groceryList.filter((g) => g.isStaple).length;

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
                <span className="text-2xl">🛒</span> Grocery List
              </h1>
              {uncheckedCount > 0 && (
                <p className="text-sm text-slate">{uncheckedCount} items to get</p>
              )}
            </div>
            {/* Share Button */}
            {user && (
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 hover:bg-concrete rounded-sm"
                title="Share list"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <Card className={`${isFullPage ? 'border-0 shadow-none' : 'mb-4'}`}>
        {/* Header for embedded mode */}
        {!isFullPage && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-xl">🛒</span> Grocery List
              {uncheckedCount > 0 && (
                <span className="text-xs bg-tab-orange/20 text-tab-orange px-2 py-1 rounded-full font-semibold">
                  {uncheckedCount}
                </span>
              )}
            </h3>
            {/* Share Button - embedded mode */}
            {user && (
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 hover:bg-concrete rounded-sm flex items-center gap-1 text-sm text-slate hover:text-black"
                title="Share list"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            )}
          </div>
        )}

        {/* At The Store / Shopping Mode Button */}
        <div className="flex flex-wrap gap-2 mb-4">
          {!atTheStore ? (
            <Button
              onClick={handleStartShopping}
              variant="primary"
              size="lg"
              className="flex-1 min-h-[56px] text-base"
            >
              🛍️ At the Store
              {stapleCount > 0 && <span className="ml-2 text-sm opacity-80">({stapleCount} staples)</span>}
            </Button>
          ) : (
            <Button
              onClick={handleStoreRunComplete}
              variant="accent"
              size="lg"
              className="flex-1 min-h-[56px] text-base bg-success hover:bg-green-600"
            >
              ✓ Store Run Complete
            </Button>
          )}
        </div>

        {/* Store Filter (only when not at the store) */}
        {!atTheStore && groceryList.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterStore('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStore === 'all' ? 'bg-black text-white' : 'bg-concrete text-charcoal hover:bg-steel'
                }`}
              >
                All Stores
              </button>
              {STORE_OPTIONS.filter(o => o.value).map(store => (
                <button
                  key={store.value}
                  onClick={() => setFilterStore(store.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStore === store.value ? 'bg-black text-white' : 'bg-concrete text-charcoal hover:bg-steel'
                  }`}
                >
                  {store.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Item List */}
        {filteredList.length === 0 ? (
          <p className="text-slate text-sm italic mb-4 py-8 text-center">
            {groceryList.length === 0 ? 'No items yet. Add something to your list!' : 'No items for this store.'}
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {filteredList
              .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
              .map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all ${
                    item.checked
                      ? 'bg-concrete/50 border-steel opacity-60'
                      : atTheStore
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-white border-steel hover:border-black'
                  }`}
                >
                  {/* Checkbox - larger for touch */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`w-10 h-10 min-w-[40px] rounded-full border-3 flex items-center justify-center transition-all ${
                      item.checked
                        ? 'bg-success border-success text-white'
                        : 'border-steel hover:border-black'
                    }`}
                  >
                    {item.checked && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-base font-medium block ${item.checked ? 'line-through text-slate' : 'text-black'}`}>
                      {item.name}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.quantity > 0 && (
                        <span className="text-sm text-slate">
                          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                        </span>
                      )}
                      {item.store && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStoreColor(item.store)}`}>
                          {getStoreName(item.store)}
                        </span>
                      )}
                      {item.isStaple && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          Staple
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions - larger touch targets */}
                  {!atTheStore && (
                    <div className="flex gap-1">
                      {/* Star/Staple Button */}
                      <button
                        onClick={() => handleToggleStaple(item.id)}
                        className={`w-12 h-12 flex items-center justify-center rounded-sm transition-colors ${
                          item.isStaple
                            ? 'text-purple-600 bg-purple-50'
                            : 'text-slate hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        title={item.isStaple ? 'Remove from staples' : 'Mark as staple'}
                      >
                        <span className="text-2xl">{item.isStaple ? '★' : '☆'}</span>
                      </button>
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="w-12 h-12 flex items-center justify-center text-slate hover:text-danger hover:bg-red-50 rounded-sm transition-colors"
                        title="Remove item"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}

        {/* Add Item Form */}
        {!atTheStore && (
          <>
            {!showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="secondary"
                size="lg"
                className="w-full min-h-[56px] text-base"
              >
                + Add Item
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-concrete rounded-sm">
                <div className="flex gap-2">
                  <Input
                    placeholder="Item name (e.g., Apples)"
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

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-24 !mb-0 text-base min-h-[52px]"
                    min={1}
                  />
                  <Input
                    placeholder="Unit (lbs, oz...)"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="flex-1 !mb-0 text-base min-h-[52px]"
                  />
                </div>

                <Select
                  options={STORE_OPTIONS}
                  value={newItem.store}
                  onChange={(e) => setNewItem({ ...newItem, store: e.target.value as GroceryStore })}
                  placeholder="Select store (optional)"
                  className="!mb-0 min-h-[52px]"
                />

                <Button onClick={handleAddItem} variant="primary" size="lg" className="w-full min-h-[56px]">
                  Add to List
                </Button>
              </div>
            )}
          </>
        )}

        {/* Shopping Mode Summary */}
        {atTheStore && checkedCount > 0 && (
          <div className="mt-4 p-4 bg-success/10 border-2 border-success/30 rounded-sm">
            <p className="text-success font-semibold text-center">
              {checkedCount} of {filteredList.length} items checked off
            </p>
          </div>
        )}
      </Card>

      {/* Share Modal */}
      <ShareListModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        listType="grocery"
        listData={groceryList}
      />
    </div>
  );
};

export default GroceryList;
