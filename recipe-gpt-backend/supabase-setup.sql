-- Recipe GPT Backend - Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Create the llm_messages table
CREATE TABLE llm_messages (
  id BIGSERIAL PRIMARY KEY,
  client_ip TEXT,
  request_type TEXT NOT NULL,
  ingredients_count INTEGER,
  style_id TEXT,
  prompt_text TEXT,
  response_text TEXT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  gemini_response JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_llm_messages_timestamp ON llm_messages(timestamp);
CREATE INDEX idx_llm_messages_success ON llm_messages(success);
CREATE INDEX idx_llm_messages_request_type ON llm_messages(request_type);
CREATE INDEX idx_llm_messages_style_id ON llm_messages(style_id);
CREATE INDEX idx_llm_messages_client_ip ON llm_messages(client_ip);

-- Enable Row Level Security (optional)
ALTER TABLE llm_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts from your backend
CREATE POLICY "Allow backend inserts" ON llm_messages
  FOR INSERT WITH CHECK (true);

-- Create a policy for reading (you can restrict this)
CREATE POLICY "Allow backend reads" ON llm_messages
  FOR SELECT USING (true);

-- Optional: Create a view for analytics
CREATE VIEW analytics_summary AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  COUNT(*) FILTER (WHERE success = false) as failed_requests,
  ROUND(AVG(response_time_ms)) as avg_response_time,
  style_id
FROM llm_messages 
GROUP BY DATE_TRUNC('hour', timestamp), style_id
ORDER BY hour DESC; 
