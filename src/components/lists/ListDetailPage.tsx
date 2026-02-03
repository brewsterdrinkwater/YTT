import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listService } from '../../services/listService';
import { UserList, ListItem, ListTag } from '../../types/lists';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

const ListDetailPage: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  const [list, setList] = useState<UserList | null>(null);
  const [tags, setTags] = useState<ListTag[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', details: '', url: '', quantity: 1, unit: '' });
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (listId) {
      const foundList = listService.getListById(listId);
      setList(foundList || null);
      setTags(listService.getTags());
    }
  }, [listId]);

  const refreshList = () => {
    if (listId) {
      const foundList = listService.getListById(listId);
      setList(foundList || null);
    }
  };

  const handleAddItem = () => {
    if (!listId || !newItem.name.trim()) return;
    listService.addItem(listId, {
      name: newItem.name,
      details: newItem.details,
      url: newItem.url || undefined,
      quantity: list?.typeId === 'grocery' ? newItem.quantity : undefined,
      unit: list?.typeId === 'grocery' ? newItem.unit : undefined,
      tags: [],
    });
    setNewItem({ name: '', details: '', url: '', quantity: 1, unit: '' });
    setShowAddForm(false);
    refreshList();
  };

  const handleToggleComplete = (itemId: string) => {
    if (!listId) return;
    listService.toggleItemComplete(listId, itemId);
    refreshList();
  };

  const handleRemoveItem = (itemId: string) => {
    if (!listId) return;
    listService.removeItem(listId, itemId);
    refreshList();
  };

  const handleUpdateItem = (itemId: string, updates: Partial<ListItem>) => {
    if (!listId) return;
    listService.updateItem(listId, itemId, updates);
    refreshList();
    setEditingItem(null);
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const newTags = listService.createTag(newTagName);
    setTags(newTags);
    setNewTagName('');
    setShowTagInput(false);
  };

  const handleAddTagToItem = (itemId: string, tagId: string) => {
    if (!listId) return;
    listService.addTagToItem(listId, itemId, tagId);
    refreshList();
  };

  const handleRemoveTagFromItem = (itemId: string, tagId: string) => {
    if (!listId) return;
    listService.removeTagFromItem(listId, itemId, tagId);
    refreshList();
  };

  const handleClearCompleted = () => {
    if (!listId) return;
    listService.clearCompleted(listId);
    refreshList();
  };

  if (!list) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="text-center py-12">
          <p className="text-gray-500">List not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Filter items
  const activeItems = list.items.filter((item) => !item.completed);
  const completedItems = list.items.filter((item) => item.completed);

  const filteredActiveItems = filterTag
    ? activeItems.filter((item) => item.tags.includes(filterTag))
    : activeItems;

  const filteredCompletedItems = filterTag
    ? completedItems.filter((item) => item.tags.includes(filterTag))
    : completedItems;

  const isGrocery = list.typeId === 'grocery';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{list.icon}</span>
            <h1 className="text-2xl font-bold">{list.name}</h1>
          </div>
          <p className="text-sm text-gray-500">
            {activeItems.length} active • {completedItems.length} completed
          </p>
        </div>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              filterTag === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(tag.id === filterTag ? null : tag.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filterTag === tag.id
                  ? tag.color
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag.name}
            </button>
          ))}
          <button
            onClick={() => setShowTagInput(true)}
            className="px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 whitespace-nowrap"
          >
            + Tag
          </button>
        </div>
      )}

      {/* Create Tag Input */}
      {showTagInput && (
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Tag name..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleCreateTag}>Add</Button>
          <button onClick={() => setShowTagInput(false)} className="text-gray-400 hover:text-gray-600 px-2">✕</button>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm ? (
        <Card className="mb-4">
          <h3 className="font-semibold mb-3">Add New Item</h3>
          <div className="space-y-3">
            <Input
              placeholder="Item name..."
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            {isGrocery && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  className="w-20"
                />
                <Input
                  placeholder="Unit (oz, cups, etc.)"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="flex-1"
                />
              </div>
            )}
            <Input
              placeholder="Details, notes..."
              value={newItem.details}
              onChange={(e) => setNewItem({ ...newItem, details: e.target.value })}
            />
            <Input
              placeholder="URL (optional)"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="flex-1">Add Item</Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-4 p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
        >
          + Add New Item
        </button>
      )}

      {/* Active Items */}
      {filteredActiveItems.length > 0 ? (
        <div className="space-y-2 mb-6">
          {filteredActiveItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              tags={tags}
              isGrocery={isGrocery}
              isEditing={editingItem === item.id}
              onToggle={() => handleToggleComplete(item.id)}
              onRemove={() => handleRemoveItem(item.id)}
              onEdit={() => setEditingItem(item.id)}
              onCancelEdit={() => setEditingItem(null)}
              onSave={(updates) => handleUpdateItem(item.id, updates)}
              onAddTag={(tagId) => handleAddTagToItem(item.id, tagId)}
              onRemoveTag={(tagId) => handleRemoveTagFromItem(item.id, tagId)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No active items</p>
        </div>
      )}

      {/* Completed Section */}
      {filteredCompletedItems.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <span className={`transition-transform ${showCompleted ? 'rotate-90' : ''}`}>▶</span>
            <span className="font-medium">Completed ({filteredCompletedItems.length})</span>
            {completedItems.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearCompleted();
                }}
                className="ml-auto text-xs text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </button>
          {showCompleted && (
            <div className="space-y-2 opacity-60">
              {filteredCompletedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  tags={tags}
                  isGrocery={isGrocery}
                  isEditing={false}
                  onToggle={() => handleToggleComplete(item.id)}
                  onRemove={() => handleRemoveItem(item.id)}
                  onEdit={() => {}}
                  onCancelEdit={() => {}}
                  onSave={() => {}}
                  onAddTag={() => {}}
                  onRemoveTag={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Item Card Component
interface ItemCardProps {
  item: ListItem;
  tags: ListTag[];
  isGrocery: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<ListItem>) => void;
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  tags,
  isGrocery,
  isEditing,
  onToggle,
  onRemove,
  onEdit,
  onCancelEdit,
  onSave,
  onAddTag,
  onRemoveTag,
}) => {
  const [editForm, setEditForm] = useState({
    name: item.name,
    details: item.details,
    url: item.url || '',
  });
  const [showTagPicker, setShowTagPicker] = useState(false);

  const itemTags = tags.filter((t) => item.tags.includes(t.id));
  const availableTags = tags.filter((t) => !item.tags.includes(t.id));

  if (isEditing) {
    return (
      <Card className="p-3">
        <div className="space-y-2">
          <Input
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Item name"
          />
          <Input
            value={editForm.details}
            onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
            placeholder="Details..."
          />
          <Input
            value={editForm.url}
            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
            placeholder="URL..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(editForm)}>Save</Button>
            <Button size="sm" variant="secondary" onClick={onCancelEdit}>Cancel</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-3 ${item.completed ? 'bg-gray-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            item.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {item.completed && '✓'}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`font-medium ${item.completed ? 'line-through text-gray-400' : ''}`}>
                {item.name}
                {isGrocery && item.quantity && item.unit && (
                  <span className="text-sm text-gray-400 font-normal ml-2">
                    ({item.quantity} {item.unit})
                  </span>
                )}
              </p>
              {item.details && (
                <p className="text-sm text-gray-500 mt-0.5">{item.details}</p>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                >
                  View Link →
                </a>
              )}
            </div>

            {/* Actions */}
            {!item.completed && (
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={onEdit}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={onRemove}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {itemTags.map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${tag.color}`}
              >
                {tag.name}
                {!item.completed && (
                  <button
                    onClick={() => onRemoveTag(tag.id)}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {!item.completed && availableTags.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                  + tag
                </button>
                {showTagPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg p-2 z-10 min-w-32">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          onAddTag(tag.id);
                          setShowTagPicker(false);
                        }}
                        className={`block w-full text-left px-2 py-1 rounded text-sm ${tag.color} hover:opacity-80`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ListDetailPage;
