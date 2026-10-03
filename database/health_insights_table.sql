-- Create health_insights table to store AI-generated health insights
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

-- Create RLS policies for health_insights
ALTER TABLE health_insights ENABLE ROW LEVEL SECURITY;

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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_health_insights_user_id ON health_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insights_created_at ON health_insights(created_at DESC);