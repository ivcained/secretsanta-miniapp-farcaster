# 🎁 Secret Santa Chain

An anonymous gifting network for the Farcaster community, built as a Mini App using Base MiniKit.

## Overview

Secret Santa Chain allows Farcaster users to participate in anonymous gift exchanges. Users can create or join gift chains, get matched with random recipients, send anonymous gifts, and discover their Secret Santa when the reveal date arrives.

### Key Features

- **🔐 Farcaster Authentication**: Sign in with your Farcaster account
- **📊 Quality Filtering**: Only users with Neynar score ≥ 0.7 can participate (ensures quality community)
- **🔗 Gift Chains**: Create themed gift chains with customizable budgets and deadlines
- **🎲 Random Matching**: Fair circular matching algorithm ensures everyone gives and receives
- **🎁 Anonymous Gifting**: Send gifts and messages without revealing your identity
- **🎉 Timed Reveals**: Identities are revealed on the scheduled reveal date
- **📱 Mini App**: Runs natively in Farcaster clients (Warpcast, etc.)

## Tech Stack

- **Framework**: Next.js 16.0.7 with App Router
- **Mini App SDK**: @coinbase/onchainkit/minikit + @farcaster/miniapp-sdk
- **Database**: Supabase (PostgreSQL)
- **User Validation**: Neynar API
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Neynar API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd p2p-ivc
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
# Neynar API
NEYNAR_API_KEY=your_neynar_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_URL=http://localhost:3000

# Score threshold (0.7 = ~27.5k eligible users)
NEYNAR_SCORE_THRESHOLD=0.7
```

5. Set up the database:
   - Create a new Supabase project
   - Run the migration in `supabase/migrations/001_initial_schema.sql`

6. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── chains/         # Gift chain CRUD + matching
│   │   ├── gifts/          # Gift sending/receiving
│   │   └── user/           # User validation
│   ├── app.tsx             # Main app component
│   ├── page.tsx            # Home page with metadata
│   └── providers.tsx       # App providers
├── components/
│   ├── auth/               # Authentication components
│   ├── chains/             # Chain-related components
│   ├── gifts/              # Gift-related components
│   ├── providers/          # Context providers
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts             # Auth utilities
│   ├── matching.ts         # Matching algorithm
│   ├── neynar.ts           # Neynar API client
│   ├── notifications.ts    # Notification utilities
│   ├── share.ts            # Sharing utilities
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # General utilities
└── types/
    └── database.ts         # TypeScript types
```

## Database Schema

### Tables

- **users**: Farcaster user profiles with Neynar scores
- **gift_chains**: Gift exchange groups with settings
- **chain_participants**: Users participating in chains
- **gifts**: Gift assignments and status
- **thank_you_messages**: Anonymous thank you notes

## API Endpoints

### Authentication
- `GET /api/auth` - Verify user authentication
- `POST /api/user/validate` - Validate user with Neynar score

### Chains
- `GET /api/chains` - List all chains
- `POST /api/chains` - Create a new chain
- `GET /api/chains/[id]` - Get chain details
- `POST /api/chains/[id]` - Join chain or trigger matching
- `POST /api/chains/[id]/reveal` - Trigger reveal

### Gifts
- `GET /api/gifts` - Get user's gifts
- `POST /api/gifts` - Send gift or mark received

## Matching Algorithm

The app uses a circular matching algorithm (Fisher-Yates shuffle) to ensure:
- Everyone gives exactly one gift
- Everyone receives exactly one gift
- No one is matched with themselves
- Fair random distribution

## Neynar Score Filtering

Users must have a Neynar quality score of 0.7 or higher to participate. This:
- Filters out bots and spam accounts
- Ensures ~27,500 eligible users from the Farcaster community
- Maintains gift exchange quality

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
NEYNAR_API_KEY=your_production_key
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXT_PUBLIC_URL=https://your-domain.vercel.app
NEYNAR_SCORE_THRESHOLD=0.7
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Base MiniKit](https://docs.base.org/builderkits/minikit/overview)
- User validation powered by [Neynar](https://neynar.com)
- Database hosted on [Supabase](https://supabase.com)