# CrabTrader

CrabTrader is an autonomous AI agent that trades on Base, mints NFTs for notable trades,
and posts updates to X (Twitter) and Farcaster. It is designed for the OpenClaw Builder
Quest and operates without human intervention once launched.

Key features:
- Onchain trading on Base via 0x swap API and Viem
- ERC-721 NFT minting for notable wins/losses
- Claude-powered market analysis with strict risk rules
- Autonomous social posting and community replies
- Full audit trail in PostgreSQL/Supabase

This agent is a bot. It is not financial advice.

## Architecture

```
src/
  index.ts                 Main autonomous loop
  config/env.ts            Environment configuration
  blockchain/              Wallet + onchain interaction helpers
  markets/                 Market data + news fetching
  ai/                      Claude prompts + response parsing
  nft/                     NFT minting logic
  social/                  Twitter and Farcaster integration
  database/                PostgreSQL client + queries
  utils/                   Logging, retry, rate limiting
contracts/                 Solidity contract (CrabTradeNFT)
scripts/                   Deployment script
database/schema.sql        Postgres schema
```

## Requirements

- Node.js 18+
- PostgreSQL (or Supabase Postgres)
- Base mainnet RPC
- Twitter API v2 credentials
- Neynar API key and Farcaster signer UUID
- Anthropic API key

## Setup

1. Install dependencies:

```
npm install
```

2. Copy environment file:

```
cp .env.example .env
```

3. Fill in `.env` with your credentials. Minimum required:

- PRIVATE_KEY
- BASE_RPC_URL
- ANTHROPIC_API_KEY
- DATABASE_URL
- TWITTER_* (if ENABLE_TWITTER=true)
- NEYNAR_API_KEY / FARCASTER_SIGNER_UUID (if ENABLE_FARCASTER=true)

4. Initialize the database:

```
psql "$DATABASE_URL" -f database/schema.sql
```

## Contract Deployment

Deploy the CrabTradeNFT contract to Base mainnet:

```
npm run deploy:nft
```

Update `NFT_CONTRACT_ADDRESS` in `.env` with the deployed address.

## Running the Agent

```
npm run dev
```

The agent loops every `LOOP_INTERVAL_MS` with jitter, performs market analysis, executes
trades, mints NFTs for notable results, posts to social, and replies to mentions.

## Safety and Controls

- **KILL_SWITCH=true** pauses all onchain actions.
- **DRY_RUN=true** skips onchain transactions while still simulating logic.
- **MIN_ETH_BALANCE** stops trading when gas is low and posts a warning.

## Notes on Wallet Management

This implementation uses a private key with Viem for production-grade automation.
If you want to use Coinbase Smart Wallet or Privy, you can:
1. Replace the signing logic in `src/blockchain/wallet.ts`.
2. Keep the rest of the agent unchanged.

## Submission Checklist

- Agent is live and posting on X or Farcaster.
- All trades are on Base mainnet and traceable on BaseScan.
- NFT contract deployed on Base mainnet.
- No human intervention after launch.

## Disclaimer

CrabTrader is an autonomous AI agent. It is not a human. It does not provide financial
advice, and all content is for transparency and experimentation only.
