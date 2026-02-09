-- User profiles table to store phone numbers for sharing
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can look up other users by phone number (for sharing)
CREATE POLICY "Users can lookup profiles by phone" ON user_profiles
  FOR SELECT USING (phone_number IS NOT NULL);

-- Shared lists table
CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_type TEXT NOT NULL CHECK (list_type IN ('grocery', 'watchlist', 'reading', 'music', 'places', 'restaurants')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_phone TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  list_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One share per list type per phone number per owner
  UNIQUE(owner_id, list_type, shared_with_phone)
);

-- Enable RLS
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

-- Owner can see their shared lists
CREATE POLICY "Owner can view shared lists" ON shared_lists
  FOR SELECT USING (auth.uid() = owner_id);

-- Owner can create shares
CREATE POLICY "Owner can create shares" ON shared_lists
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owner can update their shares
CREATE POLICY "Owner can update shares" ON shared_lists
  FOR UPDATE USING (auth.uid() = owner_id);

-- Owner can delete shares (revoke access)
CREATE POLICY "Owner can delete shares" ON shared_lists
  FOR DELETE USING (auth.uid() = owner_id);

-- Shared users can view lists shared with them
CREATE POLICY "Shared users can view lists" ON shared_lists
  FOR SELECT USING (
    auth.uid() = shared_with_user_id
    OR shared_with_phone IN (
      SELECT phone_number FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Shared users can update list data
CREATE POLICY "Shared users can update list data" ON shared_lists
  FOR UPDATE USING (
    auth.uid() = shared_with_user_id
    OR shared_with_phone IN (
      SELECT phone_number FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Function to auto-resolve shared_with_user_id when a user adds their phone
CREATE OR REPLACE FUNCTION resolve_shared_user_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user adds their phone number, update any shared_lists pointing to that phone
  UPDATE shared_lists
  SET shared_with_user_id = NEW.id, updated_at = NOW()
  WHERE shared_with_phone = NEW.phone_number
    AND shared_with_user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-resolve when phone is added/updated
CREATE TRIGGER on_phone_added
  AFTER INSERT OR UPDATE OF phone_number ON user_profiles
  FOR EACH ROW
  WHEN (NEW.phone_number IS NOT NULL)
  EXECUTE FUNCTION resolve_shared_user_ids();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shared_lists_updated_at
  BEFORE UPDATE ON shared_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable realtime for shared_lists
ALTER PUBLICATION supabase_realtime ADD TABLE shared_lists;
