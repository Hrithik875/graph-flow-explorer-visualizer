
-- Create a table for storing saved graphs
CREATE TABLE graphs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS (Row Level Security) policies
ALTER TABLE graphs ENABLE ROW LEVEL SECURITY;

-- Allow users to select only their own graphs
CREATE POLICY "Users can view their own graphs" 
  ON graphs FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own graphs
CREATE POLICY "Users can insert their own graphs" 
  ON graphs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own graphs
CREATE POLICY "Users can update their own graphs" 
  ON graphs FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own graphs
CREATE POLICY "Users can delete their own graphs" 
  ON graphs FOR DELETE
  USING (auth.uid() = user_id);
