import { storageService } from './storageService';
import { UserList, ListItem, ListTag, DEFAULT_LISTS, TAG_COLORS } from '../types/lists';

const STORAGE_KEYS = {
  LISTS: 'walt-tab-lists',
  TAGS: 'walt-tab-tags',
};

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const listService = {
  // ==================== LISTS ====================

  // Get all lists
  getLists: (): UserList[] => {
    const stored = storageService.get<UserList[]>(STORAGE_KEYS.LISTS);
    if (!stored || stored.length === 0) {
      // Initialize with default lists
      const defaultLists = DEFAULT_LISTS.map((list) => ({
        ...list,
        id: generateId(),
        items: [],
        createdAt: new Date().toISOString(),
      }));
      listService.saveLists(defaultLists);
      return defaultLists;
    }
    return stored;
  },

  // Save all lists
  saveLists: (lists: UserList[]): void => {
    storageService.set(STORAGE_KEYS.LISTS, lists);
  },

  // Get a single list by ID
  getListById: (listId: string): UserList | undefined => {
    return listService.getLists().find((list) => list.id === listId);
  },

  // Get a list by type ID (for default lists)
  getListByType: (typeId: string): UserList | undefined => {
    return listService.getLists().find((list) => list.typeId === typeId);
  },

  // Get visible lists only
  getVisibleLists: (): UserList[] => {
    return listService.getLists().filter((list) => list.isVisible);
  },

  // Create a new custom list
  createList: (name: string, icon: string, color: string): UserList[] => {
    const lists = listService.getLists();
    const newList: UserList = {
      id: generateId(),
      name,
      icon,
      color,
      typeId: `custom-${generateId()}`,
      isDefault: false,
      isVisible: true,
      items: [],
      createdAt: new Date().toISOString(),
    };
    const newLists = [...lists, newList];
    listService.saveLists(newLists);
    return newLists;
  },

  // Update list properties
  updateList: (listId: string, updates: Partial<Pick<UserList, 'name' | 'icon' | 'color' | 'isVisible'>>): UserList[] => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId ? { ...list, ...updates } : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Delete a custom list (cannot delete default lists)
  deleteList: (listId: string): UserList[] => {
    const lists = listService.getLists();
    const list = lists.find((l) => l.id === listId);
    if (list?.isDefault) {
      // Can't delete default lists, but can hide them
      return listService.updateList(listId, { isVisible: false });
    }
    const newLists = lists.filter((l) => l.id !== listId);
    listService.saveLists(newLists);
    return newLists;
  },

  // Toggle list visibility
  toggleListVisibility: (listId: string): UserList[] => {
    const lists = listService.getLists();
    const list = lists.find((l) => l.id === listId);
    if (!list) return lists;
    return listService.updateList(listId, { isVisible: !list.isVisible });
  },

  // ==================== LIST ITEMS ====================

  // Add item to a list
  addItem: (
    listId: string,
    item: Omit<ListItem, 'id' | 'addedAt' | 'completed'>
  ): UserList[] => {
    const lists = listService.getLists();
    const newItem: ListItem = {
      ...item,
      id: generateId(),
      completed: false,
      addedAt: new Date().toISOString(),
    };
    const newLists = lists.map((list) =>
      list.id === listId
        ? { ...list, items: [newItem, ...list.items] }
        : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Update an item
  updateItem: (listId: string, itemId: string, updates: Partial<ListItem>): UserList[] => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          }
        : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Toggle item completion
  toggleItemComplete: (listId: string, itemId: string): UserList[] => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    completed: !item.completed,
                    completedAt: !item.completed ? new Date().toISOString() : undefined,
                  }
                : item
            ),
          }
        : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Remove an item
  removeItem: (listId: string, itemId: string): UserList[] => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId
        ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
        : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Clear completed items from a list
  clearCompleted: (listId: string): UserList[] => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId
        ? { ...list, items: list.items.filter((item) => !item.completed) }
        : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Get items by completion status
  getActiveItems: (listId: string): ListItem[] => {
    const list = listService.getListById(listId);
    return list?.items.filter((item) => !item.completed) || [];
  },

  getCompletedItems: (listId: string): ListItem[] => {
    const list = listService.getListById(listId);
    return list?.items.filter((item) => item.completed) || [];
  },

  // ==================== TAGS ====================

  // Get all tags
  getTags: (): ListTag[] => {
    return storageService.get<ListTag[]>(STORAGE_KEYS.TAGS) || [];
  },

  // Save tags
  saveTags: (tags: ListTag[]): void => {
    storageService.set(STORAGE_KEYS.TAGS, tags);
  },

  // Create a new tag
  createTag: (name: string): ListTag[] => {
    const tags = listService.getTags();
    const colorIndex = tags.length % TAG_COLORS.length;
    const newTag: ListTag = {
      id: generateId(),
      name,
      color: TAG_COLORS[colorIndex],
    };
    const newTags = [...tags, newTag];
    listService.saveTags(newTags);
    return newTags;
  },

  // Delete a tag and remove from all items
  deleteTag: (tagId: string): { tags: ListTag[]; lists: UserList[] } => {
    // Remove from tags list
    const newTags = listService.getTags().filter((t) => t.id !== tagId);
    listService.saveTags(newTags);

    // Remove from all items
    const lists = listService.getLists();
    const newLists = lists.map((list) => ({
      ...list,
      items: list.items.map((item) => ({
        ...item,
        tags: item.tags.filter((t) => t !== tagId),
      })),
    }));
    listService.saveLists(newLists);

    return { tags: newTags, lists: newLists };
  },

  // Add tag to item
  addTagToItem: (listId: string, itemId: string, tagId: string): UserList[] => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId && !item.tags.includes(tagId)
                ? { ...item, tags: [...item.tags, tagId] }
                : item
            ),
          }
        : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Remove tag from item
  removeTagFromItem: (listId: string, itemId: string, tagId: string): UserList[] => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId
                ? { ...item, tags: item.tags.filter((t) => t !== tagId) }
                : item
            ),
          }
        : list
    );
    listService.saveLists(newLists);
    return newLists;
  },

  // Filter items by tag
  filterByTag: (listId: string, tagId: string): ListItem[] => {
    const list = listService.getListById(listId);
    return list?.items.filter((item) => item.tags.includes(tagId)) || [];
  },

  // Search items across all lists
  searchItems: (query: string): { list: UserList; item: ListItem }[] => {
    const lists = listService.getLists();
    const results: { list: UserList; item: ListItem }[] = [];
    const lowerQuery = query.toLowerCase();

    lists.forEach((list) => {
      list.items.forEach((item) => {
        if (
          item.name.toLowerCase().includes(lowerQuery) ||
          item.details.toLowerCase().includes(lowerQuery)
        ) {
          results.push({ list, item });
        }
      });
    });

    return results;
  },

  // ==================== MIGRATION ====================

  // Migrate from old list format (grocery, recipes, etc.)
  migrateOldLists: (): void => {
    const oldGrocery = storageService.get<any[]>('ytt-grocery-list');
    const oldRecipes = storageService.get<any[]>('ytt-recipes-list');
    const oldRestaurants = storageService.get<any[]>('ytt-restaurants-list');
    const oldWatchlist = storageService.get<any[]>('ytt-research-watchlist');
    const oldReading = storageService.get<any[]>('ytt-research-reading-list');
    const oldSpotify = storageService.get<any[]>('ytt-research-spotify-list');
    const oldPlaces = storageService.get<any[]>('ytt-research-places-list');

    const lists = listService.getLists();

    // Migrate grocery items
    if (oldGrocery && oldGrocery.length > 0) {
      const groceryList = lists.find((l) => l.typeId === 'grocery');
      if (groceryList && groceryList.items.length === 0) {
        const newItems: ListItem[] = oldGrocery.map((item: any) => ({
          id: item.id || generateId(),
          name: item.name,
          completed: item.checked || false,
          details: item.isStaple ? 'Staple item' : '',
          tags: [],
          quantity: item.quantity,
          unit: item.unit,
          addedAt: item.addedAt || new Date().toISOString(),
        }));
        listService.updateListItems(groceryList.id, newItems);
      }
    }

    // Migrate watchlist
    if (oldWatchlist && oldWatchlist.length > 0) {
      const watchList = lists.find((l) => l.typeId === 'watchlist');
      if (watchList && watchList.items.length === 0) {
        const newItems: ListItem[] = oldWatchlist.map((item: any) => ({
          id: generateId(),
          name: item.name,
          completed: false,
          details: item.works?.join(', ') || '',
          tags: [],
          url: item.imdbUrl || undefined,
          addedAt: item.addedAt || new Date().toISOString(),
        }));
        listService.updateListItems(watchList.id, newItems);
      }
    }

    // Migrate reading list
    if (oldReading && oldReading.length > 0) {
      const readingList = lists.find((l) => l.typeId === 'reading');
      if (readingList && readingList.items.length === 0) {
        const newItems: ListItem[] = oldReading.map((item: any) => ({
          id: generateId(),
          name: item.name,
          completed: false,
          details: item.works?.join(', ') || '',
          tags: [],
          url: item.kindleUrl || undefined,
          addedAt: item.addedAt || new Date().toISOString(),
        }));
        listService.updateListItems(readingList.id, newItems);
      }
    }

    // Migrate restaurants
    if (oldRestaurants && oldRestaurants.length > 0) {
      const restaurantList = lists.find((l) => l.typeId === 'restaurants');
      if (restaurantList && restaurantList.items.length === 0) {
        const newItems: ListItem[] = oldRestaurants.map((item: any) => ({
          id: item.id || generateId(),
          name: item.name,
          completed: item.visited || false,
          details: [item.cuisine, item.location, item.notes].filter(Boolean).join(' • '),
          tags: [],
          url: item.url || undefined,
          addedAt: item.addedAt || new Date().toISOString(),
          completedAt: item.visited ? new Date().toISOString() : undefined,
        }));
        listService.updateListItems(restaurantList.id, newItems);
      }
    }
  },

  // Helper to update list items directly
  updateListItems: (listId: string, items: ListItem[]): void => {
    const lists = listService.getLists();
    const newLists = lists.map((list) =>
      list.id === listId ? { ...list, items } : list
    );
    listService.saveLists(newLists);
  },
};
