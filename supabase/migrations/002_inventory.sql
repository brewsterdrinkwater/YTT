-- Migration: Add inventory support to research_lists
-- Extends the list_type CHECK constraint to allow inventory data

-- Drop the existing constraint
ALTER TABLE research_lists DROP CONSTRAINT IF EXISTS research_lists_list_type_check;

-- Re-create with inventory types included
ALTER TABLE research_lists ADD CONSTRAINT research_lists_list_type_check
  CHECK (list_type IN (
    'spotify', 'reading', 'watchlist', 'places',
    'grocery', 'recipes', 'restaurants', 'saved_items',
    'custom_lists', 'events', 'reminders',
    'inventory_items', 'inventory_locations'
  ));
