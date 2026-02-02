import { db } from "./client";

export type TradeStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type TradePosition = "YES" | "NO";
export type PostPlatform = "TWITTER" | "FARCASTER";
export type PostType =
  | "TRADE_ENTRY"
  | "TRADE_EXIT"
  | "NFT_MINT"
  | "DAILY_SUMMARY"
  | "REPLY"
  | "ALERT";

export interface TradeRow {
  id: string;
  market_id: string;
  market_name: string;
  position: TradePosition;
  entry_price: string;
  entry_tx_hash: string;
  entry_timestamp: string;
  exit_price: string | null;
  exit_tx_hash: string | null;
  exit_timestamp: string | null;
  pnl_bps: number | null;
  status: TradeStatus;
  nft_token_id: number | null;
}

export const insertTrade = async (params: {
  marketId: string;
  marketName: string;
  position: TradePosition;
  entryPrice: string;
  entryTxHash: string;
  entryTimestamp: Date;
}): Promise<TradeRow> => {
  const result = await db.query<TradeRow>(
    `
    INSERT INTO trades (market_id, market_name, position, entry_price, entry_tx_hash, entry_timestamp, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'OPEN')
    RETURNING *
    `,
    [
      params.marketId,
      params.marketName,
      params.position,
      params.entryPrice,
      params.entryTxHash,
      params.entryTimestamp.toISOString()
    ]
  );
  return result.rows[0];
};

export const closeTrade = async (params: {
  tradeId: string;
  exitPrice: string;
  exitTxHash: string;
  exitTimestamp: Date;
  pnlBps: number;
}): Promise<TradeRow> => {
  const result = await db.query<TradeRow>(
    `
    UPDATE trades
    SET exit_price = $1,
        exit_tx_hash = $2,
        exit_timestamp = $3,
        pnl_bps = $4,
        status = 'CLOSED'
    WHERE id = $5
    RETURNING *
    `,
    [
      params.exitPrice,
      params.exitTxHash,
      params.exitTimestamp.toISOString(),
      params.pnlBps,
      params.tradeId
    ]
  );
  return result.rows[0];
};

export const attachNftToTrade = async (params: {
  tradeId: string;
  tokenId: number;
}): Promise<void> => {
  await db.query(
    `
    UPDATE trades
    SET nft_token_id = $1
    WHERE id = $2
    `,
    [params.tokenId, params.tradeId]
  );
};

export const getOpenTrades = async (): Promise<TradeRow[]> => {
  const result = await db.query<TradeRow>(
    `
    SELECT *
    FROM trades
    WHERE status = 'OPEN'
    ORDER BY entry_timestamp DESC
    `
  );
  return result.rows;
};

export const getRecentTrades = async (limit = 20): Promise<TradeRow[]> => {
  const result = await db.query<TradeRow>(
    `
    SELECT *
    FROM trades
    ORDER BY entry_timestamp DESC
    LIMIT $1
    `,
    [limit]
  );
  return result.rows;
};

export const insertPortfolioSnapshot = async (params: {
  totalValueEth: string;
  openPositionsCount: number;
  dailyPnlBps: number;
}): Promise<void> => {
  await db.query(
    `
    INSERT INTO portfolio_snapshots (total_value_eth, open_positions_count, daily_pnl_bps)
    VALUES ($1, $2, $3)
    `,
    [params.totalValueEth, params.openPositionsCount, params.dailyPnlBps]
  );
};

export const insertSocialPost = async (params: {
  platform: PostPlatform;
  postId: string;
  content: string;
  postType: PostType;
  relatedTradeId?: string | null;
}): Promise<void> => {
  await db.query(
    `
    INSERT INTO social_posts (platform, post_id, content, post_type, related_trade_id)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      params.platform,
      params.postId,
      params.content,
      params.postType,
      params.relatedTradeId ?? null
    ]
  );
};

export const insertMention = async (params: {
  platform: PostPlatform;
  mentionId: string;
  author: string;
  content: string;
}): Promise<void> => {
  await db.query(
    `
    INSERT INTO mentions (platform, mention_id, author, content, replied)
    VALUES ($1, $2, $3, $4, false)
    ON CONFLICT (platform, mention_id) DO NOTHING
    `,
    [params.platform, params.mentionId, params.author, params.content]
  );
};

export const markMentionReplied = async (params: {
  platform: PostPlatform;
  mentionId: string;
  replyId: string;
}): Promise<void> => {
  await db.query(
    `
    UPDATE mentions
    SET replied = true, reply_id = $1
    WHERE platform = $2 AND mention_id = $3
    `,
    [params.replyId, params.platform, params.mentionId]
  );
};

export const getUnrepliedMentions = async (
  platform: PostPlatform
): Promise<
  Array<{
    id: string;
    mention_id: string;
    author: string;
    content: string;
  }>
> => {
  const result = await db.query(
    `
    SELECT id, mention_id, author, content
    FROM mentions
    WHERE platform = $1 AND replied = false
    ORDER BY timestamp ASC
    `,
    [platform]
  );
  return result.rows;
};

export const getLastDailySummaryTimestamp = async (): Promise<string | null> => {
  const result = await db.query(
    `
    SELECT timestamp
    FROM social_posts
    WHERE post_type = 'DAILY_SUMMARY'
    ORDER BY timestamp DESC
    LIMIT 1
    `
  );
  return result.rows[0]?.timestamp ?? null;
};
