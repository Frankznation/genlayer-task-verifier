import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config/env";
import { extractJson, safeJsonParse, withRetry } from "../utils/helpers";
import { buildReplyPrompt, buildTradePrompt } from "./prompts";
import type { Market, NewsHeadline } from "../markets/types";

export type TradeAction = "BUY" | "SELL" | "HOLD";

export interface TradeDecision {
  marketId: string;
  action: TradeAction;
  sizePct: number;
  confidence: number;
  reason: string;
}

export interface AiTradeResult {
  reasoning: string;
  decisions: TradeDecision[];
  marketCommentary: string;
}

const TradeDecisionSchema = z.object({
  marketId: z.string(),
  action: z.enum(["BUY", "SELL", "HOLD"]),
  sizePct: z.number().min(0).max(0.1),
  confidence: z.number().min(0).max(1),
  reason: z.string()
});

const AiTradeResultSchema = z.object({
  reasoning: z.string(),
  decisions: z.array(TradeDecisionSchema),
  marketCommentary: z.string()
});

const ReplySchema = z.object({
  reply: z.string()
});

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey
});

export const analyzeMarkets = async (params: {
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
}): Promise<AiTradeResult> => {
  const prompt = buildTradePrompt(params);

  const response = await withRetry(
    async () => {
      return anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 800,
        temperature: 0.2,
        system: "You are a reliable trading decision engine.",
        messages: [{ role: "user", content: prompt }]
      });
    },
    { retries: 2, baseDelayMs: 800, maxDelayMs: 4000 }
  );

  const text = response.content
    .map((item) => ("text" in item ? item.text : ""))
    .join("\n");
  const jsonPayload = extractJson(text);
  if (!jsonPayload) {
    throw new Error("Claude response did not include JSON");
  }
  const parsed = safeJsonParse<unknown>(jsonPayload);
  const validated = AiTradeResultSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error(`Claude response failed validation: ${validated.error.message}`);
  }

  return validated.data;
};

export const generateReply = async (params: {
  platform: "twitter" | "farcaster";
  mentionText: string;
  author: string;
}): Promise<string> => {
  const prompt = buildReplyPrompt(params);
  const response = await withRetry(
    async () => {
      return anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 200,
        temperature: 0.6,
        system: "You craft concise, friendly replies.",
        messages: [{ role: "user", content: prompt }]
      });
    },
    { retries: 2, baseDelayMs: 800, maxDelayMs: 4000 }
  );

  const text = response.content
    .map((item) => ("text" in item ? item.text : ""))
    .join("\n");
  const jsonPayload = extractJson(text);
  if (!jsonPayload) {
    return "Thanks for the ping. I am an autonomous AI agent trading on Base. No financial advice.";
  }
  const parsed = safeJsonParse<unknown>(jsonPayload);
  const validated = ReplySchema.safeParse(parsed);
  if (!validated.success) {
    return "Appreciate the mention. I am an autonomous AI agent on Base. No financial advice.";
  }
  return validated.data.reply;
};
