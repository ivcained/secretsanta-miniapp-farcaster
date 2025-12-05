-- Secret Santa Chain Database Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fid INTEGER UNIQUE NOT NULL,
  username VARCHAR(255),
  display_name VARCHAR(255),
  pfp_url TEXT,
  custody_address VARCHAR(42),
  neynar_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on fid for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_fid ON users(fid);
CREATE INDEX IF NOT EXISTS idx_users_neynar_score ON users(neynar_score);

-- Gift Chains table
CREATE TABLE IF NOT EXISTS gift_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_fid INTEGER NOT NULL REFERENCES users(fid),
  min_amount DECIMAL(18,8) NOT NULL,
  max_amount DECIMAL(18,8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETH',
  min_participants INTEGER DEFAULT 3,
  max_participants INTEGER DEFAULT 50,
  join_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  reveal_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'matching', 'active', 'revealed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for gift_chains
CREATE INDEX IF NOT EXISTS idx_gift_chains_status ON gift_chains(status);
CREATE INDEX IF NOT EXISTS idx_gift_chains_creator ON gift_chains(creator_fid);
CREATE INDEX IF NOT EXISTS idx_gift_chains_join_deadline ON gift_chains(join_deadline);
CREATE INDEX IF NOT EXISTS idx_gift_chains_reveal_date ON gift_chains(reveal_date);

-- Chain Participants table
CREATE TABLE IF NOT EXISTS chain_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES gift_chains(id) ON DELETE CASCADE,
  user_fid INTEGER NOT NULL REFERENCES users(fid),
  assigned_recipient_fid INTEGER REFERENCES users(fid),
  has_sent_gift BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chain_id, user_fid)
);

-- Create indexes for chain_participants
CREATE INDEX IF NOT EXISTS idx_chain_participants_chain ON chain_participants(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_participants_user ON chain_participants(user_fid);
CREATE INDEX IF NOT EXISTS idx_chain_participants_recipient ON chain_participants(assigned_recipient_fid);

-- Gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES gift_chains(id) ON DELETE CASCADE,
  sender_fid INTEGER NOT NULL REFERENCES users(fid),
  recipient_fid INTEGER NOT NULL REFERENCES users(fid),
  gift_type VARCHAR(20) NOT NULL CHECK (gift_type IN ('crypto', 'nft', 'message')),
  amount DECIMAL(18,8),
  currency VARCHAR(10),
  token_address VARCHAR(42),
  token_id VARCHAR(255),
  message TEXT,
  tx_hash VARCHAR(66),
  is_revealed BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revealed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for gifts
CREATE INDEX IF NOT EXISTS idx_gifts_chain ON gifts(chain_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sender ON gifts(sender_fid);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON gifts(recipient_fid);
CREATE INDEX IF NOT EXISTS idx_gifts_revealed ON gifts(is_revealed);

-- Thank You Messages table
CREATE TABLE IF NOT EXISTS thank_you_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  cast_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for thank_you_messages
CREATE INDEX IF NOT EXISTS idx_thank_you_gift ON thank_you_messages(gift_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE thank_you_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Gift chains policies
CREATE POLICY "Anyone can view open chains" ON gift_chains
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create chains" ON gift_chains
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Chain creators can update their chains" ON gift_chains
  FOR UPDATE USING (creator_fid IN (SELECT fid FROM users WHERE id::text = auth.uid()::text));

-- Chain participants policies
CREATE POLICY "Anyone can view participants" ON chain_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join chains" ON chain_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update their own record" ON chain_participants
  FOR UPDATE USING (user_fid IN (SELECT fid FROM users WHERE id::text = auth.uid()::text));

-- Gifts policies
CREATE POLICY "Recipients can view their gifts" ON gifts
  FOR SELECT USING (
    recipient_fid IN (SELECT fid FROM users WHERE id::text = auth.uid()::text)
    OR sender_fid IN (SELECT fid FROM users WHERE id::text = auth.uid()::text)
    OR is_revealed = true
  );

CREATE POLICY "Senders can create gifts" ON gifts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Senders can update their gifts" ON gifts
  FOR UPDATE USING (sender_fid IN (SELECT fid FROM users WHERE id::text = auth.uid()::text));

-- Thank you messages policies
CREATE POLICY "Anyone can view thank you messages" ON thank_you_messages
  FOR SELECT USING (true);

CREATE POLICY "Gift recipients can create thank you messages" ON thank_you_messages
  FOR INSERT WITH CHECK (true);

-- Useful views

-- View for chain statistics
CREATE OR REPLACE VIEW chain_stats AS
SELECT 
  gc.id,
  gc.name,
  gc.status,
  gc.min_amount,
  gc.max_amount,
  gc.currency,
  gc.join_deadline,
  gc.reveal_date,
  COUNT(cp.id) as participant_count,
  COUNT(CASE WHEN cp.has_sent_gift THEN 1 END) as gifts_sent_count
FROM gift_chains gc
LEFT JOIN chain_participants cp ON gc.id = cp.chain_id
GROUP BY gc.id;

-- View for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.fid,
  u.username,
  u.display_name,
  u.neynar_score,
  COUNT(DISTINCT cp.chain_id) as chains_joined,
  COUNT(DISTINCT g_sent.id) as gifts_sent,
  COUNT(DISTINCT g_received.id) as gifts_received
FROM users u
LEFT JOIN chain_participants cp ON u.fid = cp.user_fid
LEFT JOIN gifts g_sent ON u.fid = g_sent.sender_fid
LEFT JOIN gifts g_received ON u.fid = g_received.recipient_fid
GROUP BY u.fid, u.username, u.display_name, u.neynar_score;