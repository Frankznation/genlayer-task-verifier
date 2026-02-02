import "dotenv/config";
import { z } from "zod";

const numberFromEnv = (defaultValue?: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number());

const intFromEnv = (defaultValue?: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int());

const boolFromEnv = (defaultValue?: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return ["true", "1", "yes", "y"].includes(value.toLowerCase());
    }
    return value;
  }, z.boolean());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PRIVATE_KEY: z.string().min(1, "PRIVATE_KEY is required"),
  BASE_RPC_URL: z.string().url("BASE_RPC_URL must be a valid URL"),
  NFT_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .or(z.literal("")),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  TWITTER_API_KEY: z.string().optional().or(z.literal("")),
  TWITTER_API_SECRET: z.string().optional().or(z.literal("")),
  TWITTER_ACCESS_TOKEN: z.string().optional().or(z.literal("")),
  TWITTER_ACCESS_SECRET: z.string().optional().or(z.literal("")),
  NEYNAR_API_KEY: z.string().optional().or(z.literal("")),
  FARCASTER_SIGNER_UUID: z.string().optional().or(z.literal("")),
  FARCASTER_FID: z.string().optional().or(z.literal("")),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MIN_ETH_BALANCE: numberFromEnv(0.01),
  LOOP_INTERVAL_MS: intFromEnv(900000),
  MAX_POSITION_SIZE: numberFromEnv(0.1),
  ENABLE_TWITTER: boolFromEnv(true),
  ENABLE_FARCASTER: boolFromEnv(true),
  KILL_SWITCH: boolFromEnv(false),
  DRY_RUN: boolFromEnv(false),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ZEROX_API_URL: z.string().url().default("https://base.api.0x.org"),
  ZEROX_API_KEY: z.string().optional().or(z.literal("")),
  NEWS_API_URL: z.string().optional().or(z.literal("")),
  NEWS_API_KEY: z.string().optional().or(z.literal("")),
  BASESCAN_TX_BASE: z.string().url().default("https://basescan.org/tx/")
});

const parsed = EnvSchema.parse(process.env);

if (parsed.ENABLE_TWITTER) {
  const required = [
    parsed.TWITTER_API_KEY,
    parsed.TWITTER_API_SECRET,
    parsed.TWITTER_ACCESS_TOKEN,
    parsed.TWITTER_ACCESS_SECRET
  ];
  if (required.some((value) => !value)) {
    throw new Error("Twitter credentials are required when ENABLE_TWITTER=true");
  }
}

if (parsed.ENABLE_FARCASTER) {
  const required = [parsed.NEYNAR_API_KEY, parsed.FARCASTER_SIGNER_UUID];
  if (required.some((value) => !value)) {
    throw new Error("Neynar credentials are required when ENABLE_FARCASTER=true");
  }
}

export const config = {
  nodeEnv: parsed.NODE_ENV,
  privateKey: parsed.PRIVATE_KEY,
  baseRpcUrl: parsed.BASE_RPC_URL,
  nftContractAddress: parsed.NFT_CONTRACT_ADDRESS || "",
  anthropicApiKey: parsed.ANTHROPIC_API_KEY,
  twitter: {
    enabled: parsed.ENABLE_TWITTER,
    apiKey: parsed.TWITTER_API_KEY || "",
    apiSecret: parsed.TWITTER_API_SECRET || "",
    accessToken: parsed.TWITTER_ACCESS_TOKEN || "",
    accessSecret: parsed.TWITTER_ACCESS_SECRET || ""
  },
  farcaster: {
    enabled: parsed.ENABLE_FARCASTER,
    neynarApiKey: parsed.NEYNAR_API_KEY || "",
    signerUuid: parsed.FARCASTER_SIGNER_UUID || "",
    fid: parsed.FARCASTER_FID || ""
  },
  databaseUrl: parsed.DATABASE_URL,
  minEthBalance: parsed.MIN_ETH_BALANCE,
  loopIntervalMs: parsed.LOOP_INTERVAL_MS,
  maxPositionSize: parsed.MAX_POSITION_SIZE,
  killSwitch: parsed.KILL_SWITCH,
  dryRun: parsed.DRY_RUN,
  logLevel: parsed.LOG_LEVEL,
  zeroXApiUrl: parsed.ZEROX_API_URL,
  zeroXApiKey: parsed.ZEROX_API_KEY || "",
  newsApiUrl: parsed.NEWS_API_URL || "",
  newsApiKey: parsed.NEWS_API_KEY || "",
  basescanTxBase: parsed.BASESCAN_TX_BASE
};
