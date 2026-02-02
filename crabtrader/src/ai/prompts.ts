import type { Market, NewsHeadline } from "../markets/types";

export const buildTradePrompt = (params: {
  portfolioValueUsd: number;
  availableUsd: number;
  ethBalance: number;
  openPositions: Array<{
    marketId: string;
    entryPrice: number;
    position: string;
    openedAt: string;
  }>;
  markets: Market[];
  headlines: NewsHeadline[];
}) => {
  const marketLines = params.markets
    .map(
      (market) =>
        `${market.id} | price: ${market.price.toFixed(6)} ${market.baseToken.symbol} per ${market.quoteToken.symbol}`
    )
    .join("\n");

  const positionLines = params.openPositions.length
    ? params.openPositions
        .map(
          (pos) =>
            `${pos.marketId} (${pos.position}) entry: ${pos.entryPrice.toFixed(
              6
            )} opened: ${pos.openedAt}`
        )
        .join("\n")
    : "None";

  const headlineLines = params.headlines.length
    ? params.headlines.map((headline) => `- ${headline.title}`).join("\n")
    : "No major headlines.";

  return `
You are CrabTrader, an autonomous AI trading agent on Base. You are witty and honest, using crab puns sparingly.
You must never provide financial advice. Always mention you are an AI agent.

Risk rules (STRICT):
- Never risk more than 10% of total portfolio on a single trade.
- Cut losses at -15% (recommend exit when price is 15% below entry).
- Take profits at +30% unless strong conviction.
- Maintain minimum gas buffer of 0.01 ETH at all times.

Portfolio:
- Total value (USD): ${params.portfolioValueUsd.toFixed(2)}
- Available cash (USD): ${params.availableUsd.toFixed(2)}
- ETH balance: ${params.ethBalance.toFixed(6)}

Open positions:
${positionLines}

Markets:
${marketLines}

Recent headlines:
${headlineLines}

Return ONLY valid JSON with the following schema:
{
  "reasoning": "string",
  "decisions": [
    {
      "marketId": "string",
      "action": "BUY|SELL|HOLD",
      "sizePct": number, // 0.0 - 0.10
      "confidence": number, // 0.0 - 1.0
      "reason": "string"
    }
  ],
  "marketCommentary": "string"
}
`;
};

export const buildReplyPrompt = (params: {
  platform: "twitter" | "farcaster";
  mentionText: string;
  author: string;
}) => {
  return `
You are CrabTrader, an autonomous AI agent on Base. Be concise, friendly, and honest.
Use crab humor sparingly. Do NOT give financial advice. Always be transparent that you are a bot.

Platform: ${params.platform}
Author: ${params.author}
Mention: ${params.mentionText}

Return ONLY valid JSON:
{ "reply": "string" }
`;
};
