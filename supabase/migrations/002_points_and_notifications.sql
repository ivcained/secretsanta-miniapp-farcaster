-- Points and Notifications Schema
-- Run this migration after 001_initial_schema.sql

-- User Notification Tokens table - stores Farcaster notification tokens
CREATE TABLE IF NOT EXISTS user_notification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_fid INTEGER UNIQUE NOT NULL REFERENCES users(fid),
  token TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notification tokens
CREATE INDEX IF NOT EXISTS idx_notification_tokens_fid ON user_notification_tokens(user_fid);

-- User Points table - tracks points earned by users
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_fid INTEGER NOT NULL REFERENCES users(fid),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  total_gifts_sent INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  total_chains_joined INTEGER DEFAULT 0,
  total_chains_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_fid)
);

-- Create index for user_points
CREATE INDEX IF NOT EXISTS idx_user_points_fid ON user_points(user_fid);
CREATE INDEX IF NOT EXISTS idx_user_points_points ON user_points(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level);

-- Point Transactions table - logs all point changes
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_fid INTEGER NOT NULL REFERENCES users(fid),
  points INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference chain_id, gift_id, etc.
  reference_type VARCHAR(50), -- 'chain', 'gift', 'daily_login', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for point_transactions
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_fid);
CREATE INDEX IF NOT EXISTS idx_point_transactions_action ON point_transactions(action);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created ON point_transactions(created_at DESC);

-- Notifications table - stores user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_fid INTEGER NOT NULL REFERENCES users(fid),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data like chain_id, gift_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE, -- Whether push notification was sent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_fid);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Webhook Events table - logs incoming webhook events
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- Achievements table - defines available achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10), -- Emoji icon
  points_reward INTEGER DEFAULT 0,
  requirement_type VARCHAR(50), -- 'chains_joined', 'gifts_sent', 'streak', etc.
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements table - tracks earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_fid INTEGER NOT NULL REFERENCES users(fid),
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_fid, achievement_id)
);

-- Create indexes for user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_fid);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Trigger to auto-update updated_at on user_points table
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view all points" ON user_points
  FOR SELECT USING (true);

CREATE POLICY "System can insert points" ON user_points
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update points" ON user_points
  FOR UPDATE USING (true);

-- RLS Policies for point_transactions
CREATE POLICY "Users can view their own transactions" ON point_transactions
  FOR SELECT USING (true);

CREATE POLICY "System can insert transactions" ON point_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (true);

-- RLS Policies for webhook_events
CREATE POLICY "System can manage webhook events" ON webhook_events
  FOR ALL USING (true);

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Anyone can view user achievements" ON user_achievements
  FOR SELECT USING (true);

CREATE POLICY "System can insert user achievements" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- Insert default achievements
INSERT INTO achievements (code, name, description, icon, points_reward, requirement_type, requirement_value) VALUES
  ('first_chain', 'First Steps', 'Join your first Secret Santa chain', '🎄', 50, 'chains_joined', 1),
  ('chain_creator', 'Chain Creator', 'Create your first Secret Santa chain', '⭐', 100, 'chains_created', 1),
  ('generous_giver', 'Generous Giver', 'Send your first gift', '🎁', 75, 'gifts_sent', 1),
  ('gift_master', 'Gift Master', 'Send 5 gifts', '🎅', 200, 'gifts_sent', 5),
  ('social_butterfly', 'Social Butterfly', 'Join 5 different chains', '🦋', 150, 'chains_joined', 5),
  ('streak_starter', 'Streak Starter', 'Maintain a 3-day login streak', '🔥', 50, 'streak', 3),
  ('dedicated_santa', 'Dedicated Santa', 'Maintain a 7-day login streak', '❄️', 150, 'streak', 7),
  ('chain_master', 'Chain Master', 'Create 3 chains', '👑', 300, 'chains_created', 3),
  ('gift_legend', 'Gift Legend', 'Send 10 gifts', '🏆', 500, 'gifts_sent', 10),
  ('community_pillar', 'Community Pillar', 'Join 10 chains', '🌟', 400, 'chains_joined', 10)
ON CONFLICT (code) DO NOTHING;

-- View for leaderboard
CREATE OR REPLACE VIEW points_leaderboard AS
SELECT 
  up.user_fid,
  u.username,
  u.display_name,
  u.pfp_url,
  up.points,
  up.level,
  up.streak_days,
  up.total_gifts_sent,
  up.total_chains_joined,
  RANK() OVER (ORDER BY up.points DESC) as rank
FROM user_points up
JOIN users u ON up.user_fid = u.fid
ORDER BY up.points DESC;

-- Function to calculate user level based on points
CREATE OR REPLACE FUNCTION calculate_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level thresholds: 0-99=1, 100-299=2, 300-599=3, 600-999=4, 1000+=5, etc.
  IF points < 100 THEN RETURN 1;
  ELSIF points < 300 THEN RETURN 2;
  ELSIF points < 600 THEN RETURN 3;
  ELSIF points < 1000 THEN RETURN 4;
  ELSIF points < 1500 THEN RETURN 5;
  ELSIF points < 2100 THEN RETURN 6;
  ELSIF points < 2800 THEN RETURN 7;
  ELSIF points < 3600 THEN RETURN 8;
  ELSIF points < 4500 THEN RETURN 9;
  ELSE RETURN 10;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add points and update level
CREATE OR REPLACE FUNCTION add_user_points(
  p_user_fid INTEGER,
  p_points INTEGER,
  p_action VARCHAR(50),
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
  new_level INTEGER;
BEGIN
  -- Insert or update user_points
  INSERT INTO user_points (user_fid, points)
  VALUES (p_user_fid, p_points)
  ON CONFLICT (user_fid) 
  DO UPDATE SET 
    points = user_points.points + p_points,
    updated_at = NOW()
  RETURNING points INTO new_total;
  
  -- Calculate and update level
  new_level := calculate_level(new_total);
  UPDATE user_points SET level = new_level WHERE user_fid = p_user_fid;
  
  -- Log the transaction
  INSERT INTO point_transactions (user_fid, points, action, description, reference_id, reference_type)
  VALUES (p_user_fid, p_points, p_action, p_description, p_reference_id, p_reference_type);
  
  RETURN new_total;
END;
$$ LANGUAGE plpgsql;