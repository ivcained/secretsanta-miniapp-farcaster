# 🎁 Secret Santa Chain - Development Plan

## Overview
A year-round anonymous gifting Mini App for Base App that creates viral gift chains using Farcaster social graph, with Neynar API integration for quality user filtering.

---

## 🔑 Key Configuration

### Neynar API
- **API Key**: Stored in `.env.local` as `NEYNAR_API_KEY` (never commit!)
- **Base URL**: `https://api.neynar.com`
- **User Score Threshold**: `0.7+` (filters to ~27.5k high-quality accounts)
- **Score Location**: `user.experimental.neynar_user_score`

### Environment Variables
Create a `.env.local` file with:
```env
NEYNAR_API_KEY=your_api_key_here
NEYNAR_MIN_USER_SCORE=0.7
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_key
DATABASE_URL=your_database_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📋 Development Phases

### Phase 1: Foundation Setup (Week 1)
- [x] Set up MiniKit project structure
- [x] Update to Next.js 16.0.7
- [ ] Configure environment variables
- [ ] Set up Neynar API client
- [ ] Create user score validation middleware
- [ ] Set up database (Supabase/Prisma)

### Phase 2: Core Features (Week 2-3)
- [ ] User authentication with Farcaster (SIWF)
- [ ] Gift chain creation flow
- [ ] Random matching algorithm
- [ ] Gift sending mechanism (crypto/NFT)
- [ ] Anonymous messaging system

### Phase 3: Social Features (Week 4)
- [ ] Reveal mechanism with countdown
- [ ] Thank you casts generation
- [ ] Sharing and viral loops
- [ ] Notifications via webhooks

### Phase 4: Polish & Launch (Week 5)
- [ ] UI/UX refinement
- [ ] Testing and bug fixes
- [ ] Manifest configuration
- [ ] Launch checklist completion

---

## 🏗️ Technical Architecture

### Tech Stack
```
Frontend:     Next.js 16.0.7 + React 19 + TypeScript
Styling:      Tailwind CSS + shadcn/ui
Wallet:       OnchainKit + Wagmi + Viem
Auth:         Farcaster SIWF (Sign In With Farcaster)
API:          Neynar API for user data & quality scores
Database:     Supabase (PostgreSQL) or Prisma + PlanetScale
Payments:     Base network (ETH/USDC)
```

### API Endpoints

```
POST   /api/auth/verify          - Verify Farcaster auth + check Neynar score
GET    /api/user/[fid]           - Get user profile with score validation
POST   /api/chains/create        - Create new gift chain
GET    /api/chains/[id]          - Get chain details
POST   /api/chains/[id]/join     - Join a gift chain
POST   /api/gifts/send           - Send a gift
GET    /api/gifts/received       - Get received gifts
POST   /api/gifts/[id]/reveal    - Reveal gift sender
POST   /api/webhooks/neynar      - Handle Neynar webhooks
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER UNIQUE NOT NULL,
  username VARCHAR(255),
  display_name VARCHAR(255),
  pfp_url TEXT,
  custody_address VARCHAR(42),
  neynar_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gift Chains table
CREATE TABLE gift_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_fid INTEGER REFERENCES users(fid),
  min_amount DECIMAL(18,8) NOT NULL,
  max_amount DECIMAL(18,8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETH',
  min_participants INTEGER DEFAULT 3,
  max_participants INTEGER DEFAULT 50,
  join_deadline TIMESTAMP NOT NULL,
  reveal_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, matching, active, revealed, completed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chain Participants table
CREATE TABLE chain_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES gift_chains(id),
  user_fid INTEGER REFERENCES users(fid),
  assigned_recipient_fid INTEGER REFERENCES users(fid),
  has_sent_gift BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chain_id, user_fid)
);

-- Gifts table
CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES gift_chains(id),
  sender_fid INTEGER REFERENCES users(fid),
  recipient_fid INTEGER REFERENCES users(fid),
  gift_type VARCHAR(20) NOT NULL, -- 'crypto', 'nft', 'message'
  amount DECIMAL(18,8),
  currency VARCHAR(10),
  token_address VARCHAR(42),
  token_id VARCHAR(255),
  message TEXT,
  tx_hash VARCHAR(66),
  is_revealed BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW(),
  revealed_at TIMESTAMP
);

-- Thank You Messages table
CREATE TABLE thank_you_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID REFERENCES gifts(id),
  message TEXT NOT NULL,
  cast_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Neynar Integration

### User Score Validation Flow

```typescript
// lib/neynar.ts
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com';
const MIN_USER_SCORE = 0.7;

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  experimental: {
    neynar_user_score: number;
  };
}

export async function getUserByFid(fid: number): Promise<NeynarUser | null> {
  const response = await fetch(
    `${NEYNAR_BASE_URL}/v2/farcaster/user/bulk?fids=${fid}`,
    {
      headers: {
        'x-api-key': NEYNAR_API_KEY!,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await response.json();
  return data.users?.[0] || null;
}

export async function validateUserScore(fid: number): Promise<{
  isValid: boolean;
  score: number;
  user: NeynarUser | null;
}> {
  const user = await getUserByFid(fid);
  
  if (!user) {
    return { isValid: false, score: 0, user: null };
  }
  
  const score = user.experimental?.neynar_user_score || 0;
  
  return {
    isValid: score >= MIN_USER_SCORE,
    score,
    user,
  };
}
```

### Middleware for Protected Routes

```typescript
// middleware/validateUser.ts
import { validateUserScore } from '@/lib/neynar';

export async function validateUserMiddleware(fid: number) {
  const { isValid, score, user } = await validateUserScore(fid);
  
  if (!isValid) {
    throw new Error(
      `User score ${score.toFixed(2)} is below minimum threshold of 0.7. ` +
      `Please improve your Farcaster activity to participate.`
    );
  }
  
  return user;
}
```

---

## 🎨 User Interface Screens

### 1. Home Screen
- Welcome message with user's Farcaster profile
- "Create Chain" CTA button
- "Join Chain" section with active chains
- "My Gifts" section (sent/received)
- User score badge (if 0.7+)

### 2. Create Chain Screen
- Chain name and description
- Gift amount range (min/max)
- Currency selection (ETH, USDC)
- Participant limits
- Join deadline picker
- Reveal date picker

### 3. Join Chain Screen
- Chain details and rules
- Participant count
- Countdown to join deadline
- "Join Chain" button (stakes amount)

### 4. Send Gift Screen
- Assigned recipient (anonymous display)
- Gift type selection
- Amount input
- Optional message
- Send button with transaction

### 5. Reveal Screen
- Countdown timer to reveal
- Gift received preview (blurred)
- "Reveal Sender" button
- Thank you message composer
- Share to Farcaster button

### 6. Profile Screen
- User stats (chains joined, gifts sent/received)
- Neynar score display
- Gift history
- Settings

---

## 🔄 Core Flows

### Flow 1: User Onboarding
```
1. User opens Mini App in Base App
2. App checks Farcaster context
3. Fetch user data from Neynar API
4. Validate neynar_user_score >= 0.7
5. If valid: Show home screen
6. If invalid: Show "Improve your score" message
```

### Flow 2: Create Gift Chain
```
1. User clicks "Create Chain"
2. Fill in chain details
3. Set gift amount range
4. Set deadlines
5. Submit → Create chain in DB
6. Share chain link to Farcaster
```

### Flow 3: Join Gift Chain
```
1. User views chain details
2. Clicks "Join Chain"
3. Validate user score (0.7+)
4. Stake minimum gift amount
5. Add to participants list
6. Wait for matching
```

### Flow 4: Matching Algorithm
```
1. Join deadline passes
2. Fetch all participants
3. Shuffle participants array
4. Assign each person to gift the next person
5. Last person gifts first person (circular)
6. Notify all participants of their assignment
```

### Flow 5: Send Gift
```
1. User sees assigned recipient (anonymous)
2. Selects gift type and amount
3. Adds optional message
4. Confirms transaction
5. Gift recorded in DB
6. Recipient notified (anonymous)
```

### Flow 6: Reveal & Thank
```
1. Reveal date arrives
2. Recipients can reveal sender
3. Sender identity shown
4. Compose thank you message
5. Post thank you cast to Farcaster
6. Chain marked complete
```

---

## 📱 Viral Mechanics

### 1. Shareable Chain Links
- Each chain has a unique shareable link
- Rich embeds show chain details
- One-click join from cast

### 2. Thank You Casts
- Auto-generated thank you posts
- Tag sender and chain
- Include gift details (optional)

### 3. Leaderboards
- Most generous gifters
- Most chains joined
- Highest thank you ratings

### 4. Achievements
- "First Gift Sent"
- "Chain Starter"
- "Generous Giver" (10+ gifts)
- "Social Butterfly" (5+ chains)

### 5. Notifications
- Chain join confirmations
- Matching complete alerts
- Gift received notifications
- Reveal countdown reminders

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] Complete all core features
- [ ] Test with 10+ users
- [ ] Security audit for transactions
- [ ] Rate limiting on APIs
- [ ] Error handling and logging

### Manifest Configuration
```json
{
  "frame": {
    "name": "Secret Santa Chain",
    "subtitle": "Anonymous gifting made fun",
    "description": "Join gift chains, send anonymous gifts, and spread joy year-round!",
    "primaryCategory": "social",
    "tags": ["gifting", "social", "crypto", "anonymous"]
  }
}
```

### Post-Launch
- [ ] Monitor user feedback
- [ ] Track viral metrics
- [ ] Iterate on UX
- [ ] Add new features based on demand

---

## 📊 Success Metrics

| Metric | Target (Month 1) |
|--------|------------------|
| Total Users | 1,000+ |
| Chains Created | 100+ |
| Gifts Sent | 500+ |
| Thank You Casts | 300+ |
| Viral Coefficient | > 1.2 |

---

## 🛡️ Security Considerations

1. **User Validation**: Always verify Neynar score server-side
2. **Transaction Safety**: Use OnchainKit transaction trays
3. **Rate Limiting**: Prevent spam chain creation
4. **Input Validation**: Sanitize all user inputs
5. **Webhook Security**: Verify Neynar webhook signatures

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Home screen
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx            # App providers
│   ├── chains/
│   │   ├── page.tsx             # Browse chains
│   │   ├── create/page.tsx      # Create chain
│   │   └── [id]/page.tsx        # Chain details
│   ├── gifts/
│   │   ├── page.tsx             # My gifts
│   │   ├── send/page.tsx        # Send gift
│   │   └── [id]/page.tsx        # Gift details
│   ├── profile/
│   │   └── page.tsx             # User profile
│   └── api/
│       ├── auth/route.ts        # Auth endpoints
│       ├── user/[fid]/route.ts  # User endpoints
│       ├── chains/              # Chain endpoints
│       ├── gifts/               # Gift endpoints
│       └── webhooks/            # Webhook handlers
├── components/
│   ├── chains/                  # Chain components
│   ├── gifts/                   # Gift components
│   ├── ui/                      # UI components
│   └── providers/               # Context providers
├── lib/
│   ├── neynar.ts                # Neynar API client
│   ├── db.ts                    # Database client
│   ├── matching.ts              # Matching algorithm
│   └── utils.ts                 # Utilities
└── types/
    └── index.ts                 # TypeScript types
```

---

## 🎯 Next Steps

1. **Set up environment variables** with Neynar API key
2. **Create Neynar API client** with user score validation
3. **Set up database** with Supabase or Prisma
4. **Build authentication flow** with Farcaster SIWF
5. **Implement chain creation** and joining logic
6. **Build matching algorithm** for gift assignments
7. **Create gift sending** with Base transactions
8. **Implement reveal mechanism** with countdown
9. **Add sharing and notifications**
10. **Test and launch!**

---

*Ready to spread joy through anonymous gifting! 🎁✨*