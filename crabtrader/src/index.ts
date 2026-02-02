import { formatEther } from "viem";
import { analyzeMarkets, generateReply } from "./ai/analyzer";
import { config } from "./config/env";
import { createWalletContext } from "./blockchain/wallet";
import { executeBuy, executeSell } from "./blockchain/trades";
import { fetchMarkets, fetchNewsHeadlines, BASE_TOKEN } from "./markets/fetcher";
import type { Market } from "./markets/types";
import { maybeMintTradeNft } from "./nft/minter";
import { TwitterService } from "./social/twitter";
import { FarcasterService } from "./social/farcaster";
import {
  dailySummaryTemplate,
  nftMintTemplate,
  tradeEntryTemplate,
  tradeExitTemplate
} from "./social/templates";
import {
  attachNftToTrade,
  closeTrade,
  getLastDailySummaryTimestamp,
  getOpenTrades,
  getRecentTrades,
  getUnrepliedMentions,
  insertMention,
  insertPortfolioSnapshot,
  insertSocialPost,
  insertTrade,
  markMentionReplied
} from "./database/queries";
import { createLogger } from "./utils/logger";
import { jitterMs, sleep } from "./utils/helpers";

const logger = createLogger(config.logLevel);

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

const wallet = createWalletContext();
let twitterService: TwitterService | null = null;
let farcasterService: FarcasterService | null = null;

const MIN_TRADE_USD = 5;
const MIN_ALERT_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastLowBalanceAlertAt = 0;

const getTokenBalance = async (token: Market["baseToken"]) => {
  const balance = await wallet.publicClient.readContract({
    address: token.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet.address]
  });
  return Number(balance) / 10 ** token.decimals;
};

const computePortfolio = async (markets: Market[], ethBalance: number) => {
  const baseBalance = await getTokenBalance(BASE_TOKEN);
  const balances = await Promise.all(
    markets.map(async (market) => ({
      market,
      balance: await getTokenBalance(market.quoteToken)
    }))
  );

  const holdingsValue = balances.reduce(
    (sum, item) => sum + item.balance * item.market.price,
    0
  );
  const wethMarket = markets.find((market) => market.quoteToken.symbol === "WETH");
  const ethValueUsd = wethMarket ? ethBalance * wethMarket.price : 0;

  return {
    baseBalance,
    holdingsValue,
    ethValueUsd,
    totalValueUsd: baseBalance + holdingsValue + ethValueUsd
  };
};

const postToSocial = async (
  content: string,
  postType: Parameters<typeof insertSocialPost>[0]["postType"],
  relatedTradeId?: string | null
) => {
  if (config.twitter.enabled) {
    if (!twitterService) {
      twitterService = await TwitterService.create();
    }
    const postId = await twitterService.postTweet(content);
    await insertSocialPost({
      platform: "TWITTER",
      postId,
      content,
      postType,
      relatedTradeId
    });
  }
  if (config.farcaster.enabled) {
    if (!farcasterService) {
      farcasterService = new FarcasterService();
    }
    const postId = await farcasterService.postCast(content);
    await insertSocialPost({
      platform: "FARCASTER",
      postId,
      content,
      postType,
      relatedTradeId
    });
  }
};

const handleMentions = async () => {
  if (config.twitter.enabled) {
    if (!twitterService) {
      twitterService = await TwitterService.create();
    }
    const mentions = await twitterService.fetchMentions();
    for (const mention of mentions) {
      await insertMention({
        platform: "TWITTER",
        mentionId: mention.id,
        author: mention.authorId,
        content: mention.text
      });
    }
    const unreplied = await getUnrepliedMentions("TWITTER");
    for (const mention of unreplied) {
      const reply = await generateReply({
        platform: "twitter",
        mentionText: mention.content,
        author: mention.author
      });
      const replyId = await twitterService.replyToTweet(reply, mention.mention_id);
      await markMentionReplied({
        platform: "TWITTER",
        mentionId: mention.mention_id,
        replyId
      });
      await insertSocialPost({
        platform: "TWITTER",
        postId: replyId,
        content: reply,
        postType: "REPLY",
        relatedTradeId: null
      });
    }
  }

  if (config.farcaster.enabled) {
    if (!farcasterService) {
      farcasterService = new FarcasterService();
    }
    const mentions = await farcasterService.fetchMentions();
    for (const mention of mentions) {
      await insertMention({
        platform: "FARCASTER",
        mentionId: mention.id,
        author: mention.author,
        content: mention.text
      });
    }
    const unreplied = await getUnrepliedMentions("FARCASTER");
    for (const mention of unreplied) {
      const reply = await generateReply({
        platform: "farcaster",
        mentionText: mention.content,
        author: mention.author
      });
      const replyId = await farcasterService.replyToCast(reply, mention.mention_id);
      await markMentionReplied({
        platform: "FARCASTER",
        mentionId: mention.mention_id,
        replyId
      });
      await insertSocialPost({
        platform: "FARCASTER",
        postId: replyId,
        content: reply,
        postType: "REPLY",
        relatedTradeId: null
      });
    }
  }
};

const maybePostLowBalance = async (ethBalance: number) => {
  const now = Date.now();
  if (now - lastLowBalanceAlertAt < MIN_ALERT_INTERVAL_MS) return;
  lastLowBalanceAlertAt = now;
  const content = [
    "CrabTrader (AI agent) low gas alert.",
    `ETH balance ${ethBalance.toFixed(5)} < minimum ${config.minEthBalance}.`,
    "Pausing trades until refueled. No financial advice."
  ].join("\n");
  await postToSocial(content, "ALERT");
};

const maybePostDailySummary = async (
  totalValueUsd: number,
  openPositions: number,
  dailyPnlBps: number
) => {
  const lastSummary = await getLastDailySummaryTimestamp();
  const lastSummaryTime = lastSummary ? new Date(lastSummary).getTime() : 0;
  if (Date.now() - lastSummaryTime < 24 * 60 * 60 * 1000) return;

  const content = dailySummaryTemplate({
    totalValueUsd,
    openPositions,
    dailyPnlBps
  });
  await postToSocial(content, "DAILY_SUMMARY");
};

const computeDailyPnlBps = async () => {
  const recentTrades = await getRecentTrades(50);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return recentTrades
    .filter((trade) => trade.exit_timestamp)
    .filter((trade) => new Date(trade.exit_timestamp as string).getTime() >= cutoff)
    .reduce((sum, trade) => sum + (trade.pnl_bps ?? 0), 0);
};

const runIteration = async () => {
  if (config.killSwitch) {
    logger.warn("Kill switch enabled. Skipping iteration.");
    return;
  }

  const ethBalanceWei = await wallet.publicClient.getBalance({
    address: wallet.address
  });
  const ethBalance = Number(formatEther(ethBalanceWei));
  if (ethBalance < config.minEthBalance) {
    logger.warn("ETH balance below minimum threshold", { ethBalance });
    await maybePostLowBalance(ethBalance);
    return;
  }

  const [markets, headlines, openTrades] = await Promise.all([
    fetchMarkets(),
    fetchNewsHeadlines(),
    getOpenTrades()
  ]);

  const portfolio = await computePortfolio(markets, ethBalance);
  const openPositionsForAi = openTrades.map((trade) => ({
    marketId: trade.market_id,
    entryPrice: Number(trade.entry_price),
    position: trade.position,
    openedAt: trade.entry_timestamp
  }));

  let aiResult;
  try {
    aiResult = await analyzeMarkets({
      portfolioValueUsd: portfolio.totalValueUsd,
      availableUsd: portfolio.baseBalance,
      ethBalance,
      openPositions: openPositionsForAi,
      markets,
      headlines
    });
  } catch (error) {
    logger.error("AI analysis failed, defaulting to HOLD", {
      error: error instanceof Error ? error.message : error
    });
    aiResult = {
      reasoning: "Fallback HOLD",
      decisions: markets.map((market) => ({
        marketId: market.id,
        action: "HOLD" as const,
        sizePct: 0,
        confidence: 0,
        reason: "AI unavailable"
      })),
      marketCommentary: "Holding positions. AI unavailable."
    };
  }

  const marketMap = new Map(markets.map((market) => [market.id, market]));
  const decisionMap = new Map(
    aiResult.decisions.map((decision) => [
      decision.marketId,
      {
        ...decision,
        sizePct: Math.min(Math.max(decision.sizePct, 0), config.maxPositionSize)
      }
    ])
  );

  for (const trade of openTrades) {
    const market = marketMap.get(trade.market_id);
    if (!market) continue;
    const entryPrice = Number(trade.entry_price);
    const pnlBps = ((market.price - entryPrice) / entryPrice) * 10000;
    if (pnlBps <= -1500 || pnlBps >= 3000) {
      decisionMap.set(trade.market_id, {
        marketId: trade.market_id,
        action: "SELL",
        sizePct: config.maxPositionSize,
        confidence: 1,
        reason: "Risk rule trigger"
      });
    }
  }

  let availableUsd = portfolio.baseBalance;
  for (const decision of decisionMap.values()) {
    const market = marketMap.get(decision.marketId);
    if (!market || decision.action === "HOLD") continue;

    const existingTrade = openTrades.find((trade) => trade.market_id === decision.marketId);

    if (decision.action === "BUY") {
      if (existingTrade) {
        logger.info("Skipping BUY, already open position", { marketId: decision.marketId });
        continue;
      }
      const notionalUsd = Math.min(
        portfolio.totalValueUsd * decision.sizePct,
        portfolio.totalValueUsd * config.maxPositionSize,
        availableUsd
      );
      if (notionalUsd < MIN_TRADE_USD) {
        logger.info("Skipping BUY, notional too small", { marketId: decision.marketId });
        continue;
      }

      const execution = await executeBuy({
        wallet,
        market,
        notionalUsd
      });

      availableUsd -= notionalUsd;
      const trade = await insertTrade({
        marketId: market.id,
        marketName: market.name,
        position: "YES",
        entryPrice: market.price.toFixed(6),
        entryTxHash: execution.txHash,
        entryTimestamp: new Date()
      });

      const content = tradeEntryTemplate({
        marketName: market.name,
        action: "BUY",
        price: market.price,
        sizeUsd: notionalUsd,
        txHash: execution.txHash
      });
      await postToSocial(content, "TRADE_ENTRY", trade.id);
    }

    if (decision.action === "SELL") {
      if (!existingTrade) {
        logger.info("Skipping SELL, no open position", { marketId: decision.marketId });
        continue;
      }

      const sellFraction = Math.min(
        1,
        decision.sizePct / Math.max(config.maxPositionSize, 0.0001)
      );

      const execution = await executeSell({
        wallet,
        market,
        sellFraction
      });

      const exitPrice = market.price;
      const entryPrice = Number(existingTrade.entry_price);
      const pnlBps = Math.round(((exitPrice - entryPrice) / entryPrice) * 10000);

      const closedTrade = await closeTrade({
        tradeId: existingTrade.id,
        exitPrice: exitPrice.toFixed(6),
        exitTxHash: execution.txHash,
        exitTimestamp: new Date(),
        pnlBps
      });

      const exitPost = tradeExitTemplate({
        marketName: market.name,
        exitPrice,
        pnlBps,
        txHash: execution.txHash
      });
      await postToSocial(exitPost, "TRADE_EXIT", closedTrade.id);

      if (config.nftContractAddress) {
        const mint = await maybeMintTradeNft({
          wallet,
          marketName: market.name,
          position: "LONG",
          entryPrice,
          exitPrice,
          pnlBps,
          timestamp: Math.floor(Date.now() / 1000),
          commentary: aiResult.marketCommentary
        });
        if (mint) {
          await attachNftToTrade({ tradeId: closedTrade.id, tokenId: Number(mint.tokenId) });
          const nftPost = nftMintTemplate({
            marketName: market.name,
            pnlBps,
            tokenId: mint.tokenId,
            txHash: mint.txHash
          });
          await postToSocial(nftPost, "NFT_MINT", closedTrade.id);
        }
      }
    }
  }

  const wethMarket = markets.find((market) => market.quoteToken.symbol === "WETH");
  const totalValueEth = wethMarket ? portfolio.totalValueUsd / wethMarket.price : 0;
  const dailyPnlBps = await computeDailyPnlBps();
  await insertPortfolioSnapshot({
    totalValueEth: totalValueEth.toFixed(6),
    openPositionsCount: openTrades.length,
    dailyPnlBps
  });

  await handleMentions();
  await maybePostDailySummary(portfolio.totalValueUsd, openTrades.length, dailyPnlBps);
};

const start = async () => {
  logger.info("Starting CrabTrader agent", { address: wallet.address });
  if (config.twitter.enabled) {
    twitterService = await TwitterService.create();
  }
  if (config.farcaster.enabled) {
    farcasterService = new FarcasterService();
  }
  while (true) {
    const iterationStart = Date.now();
    try {
      await runIteration();
    } catch (error) {
      logger.error("Iteration failed", { error: error instanceof Error ? error.message : error });
    }
    const interval = jitterMs(config.loopIntervalMs);
    const elapsed = Date.now() - iterationStart;
    const sleepMs = Math.max(1000, interval - elapsed);
    logger.info("Sleeping until next iteration", { sleepMs });
    await sleep(sleepMs);
  }
};

start().catch((error) => {
  logger.error("Fatal error", { error: error instanceof Error ? error.message : error });
  process.exit(1);
});
