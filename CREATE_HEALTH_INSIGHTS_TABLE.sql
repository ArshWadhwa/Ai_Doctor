-- =====================================================
-- Health Insights Table Creation Script for Supabase
-- =====================================================
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
--
-- This will create the health_insights table and set up proper security policies

-- Create health_insights table
CREATE TABLE IF NOT EXISTS health_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  issue TEXT NOT NULL,
  advice TEXT NOT NULL,
  urgency TEXT DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high')),
  consultation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE health_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for health_insights
-- Users can only see their own insights
CREATE POLICY "Users can view own health insights" ON health_insights
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own insights
CREATE POLICY "Users can insert own health insights" ON health_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own insights
CREATE POLICY "Users can update own health insights" ON health_insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own insights
CREATE POLICY "Users can delete own health insights" ON health_insights
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_insights_user_id ON health_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insights_created_at ON health_insights(created_at DESC);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_health_insights_updated_at BEFORE UPDATE
    ON health_insights FOR EACH ROW EXECUTE FUNCTION
    update_updated_at_column();

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'health_insights' 
ORDER BY ordinal_position;