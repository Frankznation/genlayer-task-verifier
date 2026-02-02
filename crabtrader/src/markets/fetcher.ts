import { config } from "../config/env";
import { withRetry } from "../utils/helpers";
import type { Market, NewsHeadline, TokenInfo } from "./types";

export const BASE_TOKEN: TokenInfo = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913",
  symbol: "USDC",
  decimals: 6
};

const DEFAULT_MARKETS: Array<{ token: TokenInfo; name: string; id: string }> = [
  {
    id: "WETH-USDC",
    name: "WETH / USDC",
    token: {
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18
    }
  },
  {
    id: "DEGEN-USDC",
    name: "DEGEN / USDC",
    token: {
      address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
      symbol: "DEGEN",
      decimals: 18
    }
  },
  {
    id: "BRETT-USDC",
    name: "BRETT / USDC",
    token: {
      address: "0x532f27101965dd16442e59d40670faf5ebb142e4",
      symbol: "BRETT",
      decimals: 18
    }
  }
];

interface ZeroXPriceResponse {
  buyAmount: string;
  sellAmount: string;
  price?: string;
  estimatedGas?: string;
}

const fetchZeroXPrice = async (sellToken: TokenInfo, buyToken: TokenInfo) => {
  const sellAmount = (1 * 10 ** sellToken.decimals).toFixed(0);
  const params = new URLSearchParams({
    sellToken: sellToken.address,
    buyToken: buyToken.address,
    sellAmount
  });
  const url = `${config.zeroXApiUrl.replace(/\/$/, "")}/swap/v1/price?${params.toString()}`;
  const headers: Record<string, string> = {
    Accept: "application/json"
  };
  if (config.zeroXApiKey) {
    headers["0x-api-key"] = config.zeroXApiKey;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`0x price error: ${response.status} ${body}`);
  }
  return (await response.json()) as ZeroXPriceResponse;
};

const computePrice = (sellToken: TokenInfo, buyToken: TokenInfo, quote: ZeroXPriceResponse) => {
  const sell = Number(quote.sellAmount) / 10 ** sellToken.decimals;
  const buy = Number(quote.buyAmount) / 10 ** buyToken.decimals;
  if (!buy) return 0;
  return sell / buy;
};

export const fetchMarkets = async (): Promise<Market[]> => {
  return withRetry(
    async () => {
      const markets: Market[] = [];
      for (const market of DEFAULT_MARKETS) {
        const quote = await fetchZeroXPrice(BASE_TOKEN, market.token);
        const price = computePrice(BASE_TOKEN, market.token, quote);
        markets.push({
          id: market.id,
          name: market.name,
          baseToken: BASE_TOKEN,
          quoteToken: market.token,
          price,
          updatedAt: Date.now()
        });
      }
      return markets;
    },
    {
      retries: 2,
      baseDelayMs: 500,
      maxDelayMs: 3000
    }
  );
};

export const fetchNewsHeadlines = async (): Promise<NewsHeadline[]> => {
  const url =
    config.newsApiUrl ||
    "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";
  const headers: Record<string, string> = {};
  if (config.newsApiKey) {
    headers.Authorization = `Apikey ${config.newsApiKey}`;
  }

  return withRetry(
    async () => {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`News API error: ${response.status} ${body}`);
      }
      const json = (await response.json()) as { Data?: unknown[] };
      const items = Array.isArray(json.Data) ? json.Data : [];
      return items.slice(0, 5).map((item: any) => ({
        source: item.source ?? "unknown",
        title: item.title ?? "Untitled",
        url: item.url ?? "",
        publishedAt: item.published_on
          ? new Date(item.published_on * 1000).toISOString()
          : new Date().toISOString()
      }));
    },
    { retries: 2, baseDelayMs: 500, maxDelayMs: 3000 }
  );
};
