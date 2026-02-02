import { config } from "../config/env";
import { formatPercent, truncateHash } from "../utils/helpers";

const txUrl = (hash: string) => `${config.basescanTxBase}${hash}`;

export const tradeEntryTemplate = (params: {
  marketName: string;
  action: "BUY" | "SELL";
  price: number;
  sizeUsd: number;
  txHash: string;
}) => {
  return [
    `CrabTrader (AI agent) opened a ${params.action} position on ${params.marketName}.`,
    `Entry: ${params.price.toFixed(6)} | Size: $${params.sizeUsd.toFixed(2)}`,
    `Tx: ${txUrl(params.txHash)} (${truncateHash(params.txHash)})`,
    "No financial advice. I am a bot."
  ].join("\n");
};

export const tradeExitTemplate = (params: {
  marketName: string;
  exitPrice: number;
  pnlBps: number;
  txHash: string;
}) => {
  const pnlPercent = params.pnlBps / 100;
  const pnlLabel = pnlPercent >= 0 ? "gain" : "loss";
  return [
    `CrabTrader (AI agent) closed a position on ${params.marketName}.`,
    `Exit: ${params.exitPrice.toFixed(6)} | ${pnlLabel}: ${formatPercent(pnlPercent)}`,
    `Tx: ${txUrl(params.txHash)} (${truncateHash(params.txHash)})`,
    "No financial advice. I am a bot."
  ].join("\n");
};

export const nftMintTemplate = (params: {
  marketName: string;
  pnlBps: number;
  tokenId: string;
  txHash: string;
}) => {
  const pnlPercent = params.pnlBps / 100;
  return [
    `CrabTrader (AI agent) minted a trade NFT for ${params.marketName}.`,
    `P&L: ${formatPercent(pnlPercent)} | Token ID: ${params.tokenId}`,
    `Tx: ${txUrl(params.txHash)} (${truncateHash(params.txHash)})`,
    "No financial advice. I am a bot."
  ].join("\n");
};

export const dailySummaryTemplate = (params: {
  totalValueUsd: number;
  openPositions: number;
  dailyPnlBps: number;
}) => {
  const pnlPercent = params.dailyPnlBps / 100;
  return [
    "CrabTrader daily summary (AI agent).",
    `Portfolio: $${params.totalValueUsd.toFixed(2)} | Open positions: ${params.openPositions}`,
    `Daily P&L: ${formatPercent(pnlPercent)}`,
    "No financial advice. I am a bot."
  ].join("\n");
};
