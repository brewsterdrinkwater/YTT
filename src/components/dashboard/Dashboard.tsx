import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { Entry, DashboardItem } from '../../types';
import { UserList, ListTag } from '../../types/lists';
import { DASHBOARD_KEYWORDS } from '../../constants/config';
import { formatDisplayDate, parseISO } from '../../utils/dateUtils';
import { listService } from '../../services/listService';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';
import Modal from '../common/Modal';

// Dashboard tab type
type DashboardTab = 'lists' | 'insights' | 'search';

// List Card Component - Shows summary with drill-in
interface ListCardProps {
  list: UserList;
  onOpen: () => void;
}

const ListCard: React.FC<ListCardProps> = ({ list, onOpen }) => {
  const activeCount = list.items.filter((i) => !i.completed).length;
  const completedCount = list.items.filter((i) => i.completed).length;

  return (
    <button
      onClick={onOpen}
      className={`w-full p-4 rounded-xl text-left transition-all hover:shadow-md ${list.color} border border-gray-100`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{list.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{list.name}</h3>
            <p className="text-xs text-gray-500">
              {activeCount > 0 ? `${activeCount} active` : 'No items'}
              {completedCount > 0 && ` • ${completedCount} done`}
            </p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {/* Preview of first 2 active items */}
      {activeCount > 0 && (
        <div className="mt-3 space-y-1">
          {list.items
            .filter((i) => !i.completed)
            .slice(0, 2)
            .map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          {activeCount > 2 && (
            <p className="text-xs text-gray-400 pl-3.5">+{activeCount - 2} more</p>
          )}
        </div>
      )}
    </button>
  );
};

// Diary Search Component
const DiarySearchSection: React.FC = () => {
  const { searchEntries } = useEntries();
  const { setCurrentDate } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Entry[]>([]);

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      const searchResults = searchEntries(searchQuery);
      setResults(searchResults.slice(0, 5));
    },
    [searchEntries]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleEntryClick = (entry: Entry) => {
    setCurrentDate(parseISO(entry.date));
    navigate('/entry');
  };

  return (
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>🔍</span> Search Diary
      </h3>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search entries, locations, activities..."
        className="mb-3"
      />
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((entry) => (
            <li
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <p className="text-sm font-medium">{formatDisplayDate(entry.date)}</p>
              <p className="text-xs text-gray-500 truncate">
                {entry.location} • {entry.highlights || 'No highlights'}
              </p>
            </li>
          ))}
        </ul>
      )}
      {query && results.length === 0 && (
        <p className="text-sm text-gray-400 italic">No entries found</p>
      )}
    </Card>
  );
};

// Dashboard Section for diary insights
interface DashboardSectionProps {
  title: string;
  icon: string;
  items: DashboardItem[];
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, icon, items }) => {
  if (items.length === 0) return null;
  return (
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <li key={index} className="p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-900">{item.text}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDisplayDate(item.date)} • {item.location}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
};

// Extract functions
const extractWorkouts = (entries: Entry[]): DashboardItem[] => {
  return entries
    .filter((e) => e.activities.workout)
    .map((e) => ({
      text: `${e.activities.workout!.type} - ${e.activities.workout!.duration}min`,
      date: e.date,
      location: e.location === 'other' ? e.otherLocationName || 'Other' : e.location,
      entryId: e.id,
    }))
    .slice(0, 5);
};

const extractIdeas = (entries: Entry[]): DashboardItem[] => {
  const keywords = DASHBOARD_KEYWORDS.ideas;
  return entries
    .filter((e) => e.highlights && keywords.some((kw) => e.highlights!.toLowerCase().includes(kw)))
    .map((e) => ({
      text: e.highlights!,
      date: e.date,
      location: e.location === 'other' ? e.otherLocationName || 'Other' : e.location,
      entryId: e.id,
    }))
    .slice(0, 5);
};

// List icons for custom list creation
const LIST_ICONS = ['📋', '🎯', '💡', '🎁', '✈️', '🏠', '💰', '🎮', '🎨', '📷', '🎵', '🍕'];
const LIST_COLORS = [
  'bg-blue-50',
  'bg-green-50',
  'bg-yellow-50',
  'bg-red-50',
  'bg-purple-50',
  'bg-pink-50',
  'bg-indigo-50',
  'bg-orange-50',
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { entries, migrateFromLocalStorage } = useEntries();
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<DashboardTab>('lists');
  const [lists, setLists] = useState<UserList[]>([]);
  const [tags, setTags] = useState<ListTag[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showManageLists, setShowManageLists] = useState(false);
  const [newList, setNewList] = useState({ name: '', icon: '📋', color: 'bg-blue-50' });
  const [migrating, setMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState('');

  useEffect(() => {
    // Initialize lists and migrate old data
    listService.migrateOldLists();
    setLists(listService.getVisibleLists());
    setTags(listService.getTags());
  }, []);

  const refreshLists = () => {
    setLists(listService.getVisibleLists());
    setTags(listService.getTags());
  };

  const handleCreateList = () => {
    if (!newList.name.trim()) return;
    listService.createList(newList.name, newList.icon, newList.color);
    setNewList({ name: '', icon: '📋', color: 'bg-blue-50' });
    setShowCreateList(false);
    refreshLists();
    showToast(`Created "${newList.name}" list`, 'success');
  };

  const handleToggleListVisibility = (listId: string) => {
    listService.toggleListVisibility(listId);
    refreshLists();
  };

  const handleDeleteList = (listId: string) => {
    const list = listService.getListById(listId);
    if (list?.isDefault) {
      listService.updateList(listId, { isVisible: false });
      showToast(`Hidden "${list.name}"`, 'success');
    } else {
      listService.deleteList(listId);
      showToast('List deleted', 'success');
    }
    refreshLists();
  };

  const handleOpenList = (listId: string) => {
    navigate(`/lists/${listId}`);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateMessage('');
    try {
      const count = await migrateFromLocalStorage();
      setMigrateMessage(count > 0 ? `Migrated ${count} entries!` : 'No new entries.');
    } catch {
      setMigrateMessage('Migration failed.');
    }
    setMigrating(false);
  };

  const workouts = extractWorkouts(entries);
  const ideas = extractIdeas(entries);

  // Get all lists including hidden for management
  const allLists = listService.getLists();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {migrateMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${migrateMessage.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {migrateMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('lists')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'lists'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          📋 Lists
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'insights'
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          💡 Insights
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'search'
              ? 'bg-green-100 text-green-700 border-2 border-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
          }`}
        >
          🔍 Search
        </button>
      </div>

      {/* Lists Tab */}
      {activeTab === 'lists' && (
        <>
          {/* List Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onOpen={() => handleOpenList(list.id)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowCreateList(true)}
              className="flex-1 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors text-sm font-medium"
            >
              + Create New List
            </button>
            <button
              onClick={() => setShowManageLists(true)}
              className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
              title="Manage lists"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>

          {/* Data Management */}
          <Card className="bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Data</h3>
            <div className="flex gap-3">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {migrating ? 'Migrating...' : '📤 Import Local'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">{entries.length} diary entries</p>
          </Card>
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <>
          {entries.length === 0 ? (
            <Card className="text-center py-12">
              <span className="text-4xl mb-4 block">📊</span>
              <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
              <p className="text-gray-500">Start adding entries to see insights.</p>
            </Card>
          ) : (
            <>
              <DashboardSection title="Recent Workouts" icon="🏋️" items={workouts} />
              <DashboardSection title="Ideas & Insights" icon="💡" items={ideas} />
            </>
          )}
        </>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && <DiarySearchSection />}

      {/* Create List Modal */}
      <Modal
        isOpen={showCreateList}
        onClose={() => setShowCreateList(false)}
        title="Create New List"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
            <Input
              value={newList.name}
              onChange={(e) => setNewList({ ...newList, name: e.target.value })}
              placeholder="e.g., Gift Ideas, Travel Bucket List"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Icon</label>
            <div className="flex flex-wrap gap-2">
              {LIST_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewList({ ...newList, icon })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    newList.icon === icon
                      ? 'bg-blue-100 border-2 border-blue-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Color</label>
            <div className="flex flex-wrap gap-2">
              {LIST_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewList({ ...newList, color })}
                  className={`w-10 h-10 rounded-lg ${color} transition-all ${
                    newList.color === color
                      ? 'ring-2 ring-blue-400 ring-offset-2'
                      : 'hover:opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreateList} className="flex-1">
              Create List
            </Button>
            <Button variant="secondary" onClick={() => setShowCreateList(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Lists Modal */}
      <Modal
        isOpen={showManageLists}
        onClose={() => setShowManageLists(false)}
        title="Manage Lists"
        size="md"
      >
        <div className="space-y-2">
          {allLists.map((list) => (
            <div
              key={list.id}
              className={`flex items-center justify-between p-3 rounded-lg ${list.color} ${
                !list.isVisible ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{list.icon}</span>
                <div>
                  <p className="font-medium text-sm">{list.name}</p>
                  <p className="text-xs text-gray-500">
                    {list.items.length} items
                    {list.isDefault && ' • Default'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleListVisibility(list.id)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded"
                  title={list.isVisible ? 'Hide list' : 'Show list'}
                >
                  {list.isVisible ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
                {!list.isDefault && (
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded"
                    title="Delete list"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setShowManageLists(false)} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
