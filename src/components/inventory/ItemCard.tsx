import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { InventoryItem, INVENTORY_CATEGORIES } from '../../types/inventory';

interface ItemCardProps {
  item: InventoryItem;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDelete: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, viewMode, onEdit, onDelete }) => {
  const { getLocationPath } = useInventory();
  const [showMenu, setShowMenu] = useState(false);

  const cat = INVENTORY_CATEGORIES[item.category];
  const locationPath = getLocationPath(item.locationId, item.zoneId, item.spotId);

  if (viewMode === 'grid') {
    return (
      <div className="border-2 border-black bg-white group relative">
        {/* Image or placeholder */}
        <div className="aspect-square bg-concrete relative overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {cat.icon}
            </div>
          )}
          {/* Category badge */}
          <span
            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-tiny font-medium border rounded-full ${cat.color}`}
          >
            {cat.icon} {cat.label}
          </span>
          {/* Menu trigger */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 border border-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute top-8 right-1.5 bg-white border-2 border-black shadow-lg z-10">
              <button
                onClick={() => { setShowMenu(false); onEdit(); }}
                className="block w-full text-left px-3 py-1.5 text-tiny hover:bg-concrete"
              >
                Edit
              </button>
              <button
                onClick={() => { setShowMenu(false); onDelete(); }}
                className="block w-full text-left px-3 py-1.5 text-tiny text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-2">
          <h3 className="text-small font-semibold text-black truncate">{item.name}</h3>
          <p className="text-tiny text-slate truncate mt-0.5">
            📍 {locationPath}
          </p>
          {item.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-tiny bg-concrete text-slate rounded-full"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="text-tiny text-slate">+{item.tags.length - 2}</span>
              )}
            </div>
          )}
          {item.estimatedValue != null && item.estimatedValue > 0 && (
            <p className="text-tiny text-slate mt-1 font-medium">
              ${item.estimatedValue.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="border-2 border-black bg-white flex items-center gap-3 p-3 group relative">
      {/* Thumbnail */}
      <div className="w-14 h-14 flex-shrink-0 border border-steel bg-concrete overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">{cat.icon}</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-small font-semibold text-black truncate">{item.name}</h3>
          <span className={`px-1.5 py-0.5 text-tiny font-medium border rounded-full flex-shrink-0 ${cat.color}`}>
            {cat.icon} {cat.label}
          </span>
        </div>
        <p className="text-tiny text-slate truncate mt-0.5">
          📍 {locationPath}
        </p>
        {item.description && (
          <p className="text-tiny text-slate truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {item.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 text-tiny bg-concrete text-slate rounded-full">
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-tiny text-slate">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
          {item.quantity > 1 && (
            <span className="text-tiny text-slate">x{item.quantity}</span>
          )}
          {item.estimatedValue != null && item.estimatedValue > 0 && (
            <span className="text-tiny text-slate font-medium">
              ${item.estimatedValue.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        {item.productUrl && (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate hover:text-black transition-colors"
            title="View product"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </a>
        )}
        <button
          onClick={onEdit}
          className="p-1.5 text-slate hover:text-black transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate hover:text-red-600 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
