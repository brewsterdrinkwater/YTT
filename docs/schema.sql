CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  other_location_name TEXT,
  trip_type TEXT CHECK (trip_type IN ('business', 'pleasure')),
  feeling INTEGER NOT NULL CHECK (feeling >= 1 AND feeling <= 10),
  highlights TEXT,
  activities JSONB DEFAULT '{}',
  auto_detected JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_entries_user_date ON entries(user_id, date DESC);
CREATE INDEX idx_entries_location ON entries(user_id, location);
CREATE INDEX idx_entries_feeling ON entries(user_id, feeling);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE research_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL CHECK (list_type IN ('spotify', 'reading', 'watchlist', 'places')),
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, list_type)
);

CREATE TABLE research_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cached_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_history_user ON research_history(user_id, created_at DESC);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries" ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own research lists" ON research_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own research lists" ON research_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own research lists" ON research_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own research lists" ON research_lists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own research history" ON research_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own research history" ON research_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own research history" ON research_history FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_updated_at BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER research_lists_updated_at BEFORE UPDATE ON research_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
