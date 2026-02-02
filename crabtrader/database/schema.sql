CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_position') THEN
    CREATE TYPE trade_position AS ENUM ('YES', 'NO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_status') THEN
    CREATE TYPE trade_status AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_platform') THEN
    CREATE TYPE post_platform AS ENUM ('TWITTER', 'FARCASTER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
    CREATE TYPE post_type AS ENUM ('TRADE_ENTRY', 'TRADE_EXIT', 'NFT_MINT', 'DAILY_SUMMARY', 'REPLY', 'ALERT');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
    ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'ALERT';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL,
  market_name text NOT NULL,
  position trade_position NOT NULL,
  entry_price numeric NOT NULL,
  entry_tx_hash text NOT NULL,
  entry_timestamp timestamptz NOT NULL DEFAULT now(),
  exit_price numeric,
  exit_tx_hash text,
  exit_timestamp timestamptz,
  pnl_bps integer,
  status trade_status NOT NULL DEFAULT 'OPEN',
  nft_token_id integer
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  total_value_eth numeric NOT NULL,
  open_positions_count integer NOT NULL,
  daily_pnl_bps integer NOT NULL
);

CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform post_platform NOT NULL,
  post_id text NOT NULL,
  content text NOT NULL,
  post_type post_type NOT NULL,
  related_trade_id uuid REFERENCES trades(id),
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform post_platform NOT NULL,
  mention_id text NOT NULL,
  author text NOT NULL,
  content text NOT NULL,
  replied boolean NOT NULL DEFAULT false,
  reply_id text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, mention_id)
);
