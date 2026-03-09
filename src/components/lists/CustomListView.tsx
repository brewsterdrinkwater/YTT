import React, { useState } from 'react';
import { useLists } from '../../contexts/ListsContext';
import { CustomList, CustomFieldDefinition } from '../../types/customList';

interface CustomListViewProps {
  list: CustomList;
}

const CustomListView: React.FC<CustomListViewProps> = ({ list }) => {
  const { addCustomListItem, updateCustomListItem, removeCustomListItem, toggleCustomListItem } = useLists();
  const [newItemName, setNewItemName] = useState('');
  const [newItemFields, setNewItemFields] = useState<Record<string, string | number | boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    addCustomListItem(list.id, newItemName.trim(), newItemFields);
    setNewItemName('');
    setNewItemFields({});
    setShowAddForm(false);
  };

  const renderFieldInput = (
    field: CustomFieldDefinition,
    value: string | number | boolean | undefined,
    onChange: (val: string | number | boolean) => void,
    compact = false,
  ) => {
    const baseClass = compact
      ? 'px-2 py-1 border border-steel rounded-sm text-xs w-full'
      : 'px-3 py-2 border-2 border-steel rounded-sm text-sm w-full focus:border-black focus:outline-none';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.name}
            className={baseClass}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={field.name}
            className={baseClass}
          />
        );
      case 'url':
        return (
          <input
            type="url"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`https://...`}
            className={baseClass}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-black rounded-sm border-2 border-black"
            />
            <span className={compact ? 'text-xs' : 'text-sm'}>{field.name}</span>
          </label>
        );
      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseClass}
          >
            <option value="">{field.name}...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  const uncheckedItems = list.items.filter((item) => !item.checked);
  const checkedItems = list.items.filter((item) => item.checked);

  return (
    <div className="space-y-4">
      {/* Quick add */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add item..."
          className="flex-1 px-4 py-3 border-2 border-black rounded-sm text-sm placeholder:text-slate"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !showAddForm) handleAddItem();
          }}
        />
        {list.fields.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-3 py-2 border-2 rounded-sm text-sm font-semibold transition-colors ${
              showAddForm ? 'bg-black text-white border-black' : 'border-steel text-charcoal hover:border-black'
            }`}
            title="Add details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
        <button
          onClick={handleAddItem}
          disabled={!newItemName.trim()}
          className="px-6 py-3 bg-black text-white font-semibold text-sm rounded-sm hover:bg-charcoal transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Expanded add form with custom fields */}
      {showAddForm && list.fields.length > 0 && (
        <div className="p-4 border-2 border-black rounded-sm bg-concrete space-y-3">
          <p className="text-xs font-semibold text-slate uppercase">Item Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {list.fields
              .filter((f) => f.type !== 'boolean')
              .map((field) => (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderFieldInput(field, newItemFields[field.name], (val) =>
                    setNewItemFields({ ...newItemFields, [field.name]: val })
                  )}
                </div>
              ))}
          </div>
          {list.fields.filter((f) => f.type === 'boolean').length > 0 && (
            <div className="flex flex-wrap gap-4 pt-2">
              {list.fields
                .filter((f) => f.type === 'boolean')
                .map((field) => (
                  <div key={field.id}>
                    {renderFieldInput(field, newItemFields[field.name], (val) =>
                      setNewItemFields({ ...newItemFields, [field.name]: val })
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      {uncheckedItems.length === 0 && checkedItems.length === 0 && (
        <div className="text-center py-8">
          <span className="text-4xl">{list.icon}</span>
          <p className="mt-3 text-slate text-sm">No items yet. Add your first item above.</p>
        </div>
      )}

      <div className="space-y-2">
        {uncheckedItems.map((item) => (
          <div
            key={item.id}
            className="p-3 border-2 border-concrete rounded-sm hover:border-black transition-colors group"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCustomListItem(list.id, item.id)}
                className="w-5 h-5 text-black rounded-sm border-2 border-black flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.name}</p>
                {/* Show field values inline */}
                {Object.entries(item.fields).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {list.fields.map((fieldDef) => {
                      const val = item.fields[fieldDef.name];
                      if (val === undefined || val === '' || val === false) return null;
                      if (fieldDef.type === 'boolean' && val === true) {
                        return (
                          <span key={fieldDef.id} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            {fieldDef.name}
                          </span>
                        );
                      }
                      if (fieldDef.type === 'url') {
                        return (
                          <a
                            key={fieldDef.id}
                            href={String(val)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {fieldDef.name}
                          </a>
                        );
                      }
                      if (fieldDef.type === 'number') {
                        return (
                          <span key={fieldDef.id} className="text-xs text-slate">
                            {fieldDef.name}: ${val}
                          </span>
                        );
                      }
                      return (
                        <span key={fieldDef.id} className="text-xs text-slate">
                          {String(val)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Edit / Delete */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                  className="p-1 text-slate hover:text-black"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => removeCustomListItem(list.id, item.id)}
                  className="p-1 text-slate hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Inline edit */}
            {editingItem === item.id && (
              <div className="mt-3 pt-3 border-t border-concrete space-y-2">
                {list.fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-charcoal w-20 flex-shrink-0">{field.name}</span>
                    <div className="flex-1">
                      {renderFieldInput(
                        field,
                        item.fields[field.name],
                        (val) => updateCustomListItem(list.id, item.id, { fields: { ...item.fields, [field.name]: val } }),
                        true
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Checked items */}
      {checkedItems.length > 0 && (
        <div className="pt-4 border-t border-concrete">
          <p className="text-xs font-semibold text-slate uppercase mb-2">
            Completed ({checkedItems.length})
          </p>
          <div className="space-y-1">
            {checkedItems.map((item) => (
              <div
                key={item.id}
                className="p-2 flex items-center gap-3 opacity-60 group"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggleCustomListItem(list.id, item.id)}
                  className="w-4 h-4 text-black rounded-sm border-2 border-steel flex-shrink-0"
                />
                <span className="text-sm line-through flex-1">{item.name}</span>
                <button
                  onClick={() => removeCustomListItem(list.id, item.id)}
                  className="p-1 text-slate hover:text-red-500 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomListView;
