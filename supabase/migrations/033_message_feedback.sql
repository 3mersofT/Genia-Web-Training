-- Migration 033: Message Feedback table
-- Stores thumbs up/down feedback on GENIA assistant messages

CREATE TABLE IF NOT EXISTS message_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  conversation_id TEXT,
  feedback TEXT NOT NULL CHECK (feedback IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_message_feedback_user ON message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_created ON message_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_message_feedback_feedback ON message_feedback(feedback);

-- RLS policies
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert/update their own feedback
CREATE POLICY "Users can manage own feedback" ON message_feedback
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all feedback (for admin analytics)
CREATE POLICY "Service role can read all feedback" ON message_feedback
  FOR SELECT USING (true);
