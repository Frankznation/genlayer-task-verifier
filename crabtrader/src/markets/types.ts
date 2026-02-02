export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

export interface Market {
  id: string;
  name: string;
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  price: number;
  volume24h?: number;
  updatedAt: number;
}

export interface NewsHeadline {
  source: string;
  title: string;
  url: string;
  publishedAt: string;
}
