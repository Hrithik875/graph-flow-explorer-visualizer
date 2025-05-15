
-- Create a table for storing graphs
CREATE TABLE IF NOT EXISTS graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Set up permissions
  CONSTRAINT graphs_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create RLS policies
ALTER TABLE graphs ENABLE ROW LEVEL SECURITY;

-- Users can view their own graphs
CREATE POLICY "Users can view their own graphs" ON graphs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create graphs
CREATE POLICY "Users can create their own graphs" ON graphs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own graphs
CREATE POLICY "Users can update their own graphs" ON graphs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own graphs
CREATE POLICY "Users can delete their own graphs" ON graphs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS graphs_user_id_idx ON graphs (user_id);

-- Create a function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER graphs_updated_at
BEFORE UPDATE ON graphs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
