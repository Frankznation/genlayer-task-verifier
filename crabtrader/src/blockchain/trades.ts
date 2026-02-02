import { type Address, type Hex } from "viem";
import { config } from "../config/env";
import type { Market } from "../markets/types";
import { withRetry } from "../utils/helpers";
import type { WalletContext } from "./wallet";

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

interface ZeroXQuote {
  to: Address;
  data: Hex;
  value: string;
  gas: string;
  gasPrice: string;
  allowanceTarget: Address;
  sellAmount: string;
  buyAmount: string;
  price: string;
}

export interface TradeExecution {
  txHash: Hex;
  entryPrice: number;
  sizeUsd: number;
  receivedAmount: string;
}

const toBaseUnits = (value: number, decimals: number) => {
  const scaled = Math.floor(value * 10 ** decimals);
  return scaled.toString();
};

const fetchZeroXQuote = async (params: {
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
}) => {
  const url = `${config.zeroXApiUrl.replace(/\/$/, "")}/swap/v1/quote?sellToken=${params.sellToken}&buyToken=${params.buyToken}&sellAmount=${params.sellAmount}`;
  const headers: Record<string, string> = {
    Accept: "application/json"
  };
  if (config.zeroXApiKey) {
    headers["0x-api-key"] = config.zeroXApiKey;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`0x quote error: ${response.status} ${body}`);
  }
  return (await response.json()) as ZeroXQuote;
};

const ensureAllowance = async (params: {
  wallet: WalletContext;
  token: Address;
  spender: Address;
  amount: bigint;
}) => {
  const currentAllowance = await params.wallet.publicClient.readContract({
    address: params.token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [params.wallet.address, params.spender]
  });
  if (currentAllowance >= params.amount) return;

  if (config.dryRun) return;

  const hash = await params.wallet.walletClient.writeContract({
    address: params.token,
    abi: erc20Abi,
    functionName: "approve",
    args: [params.spender, params.amount]
  });
  await params.wallet.publicClient.waitForTransactionReceipt({ hash });
};

export const executeBuy = async (params: {
  wallet: WalletContext;
  market: Market;
  notionalUsd: number;
}): Promise<TradeExecution> => {
  const sellAmount = toBaseUnits(params.notionalUsd, params.market.baseToken.decimals);
  const quote = await withRetry(
    () =>
      fetchZeroXQuote({
        sellToken: params.market.baseToken.address,
        buyToken: params.market.quoteToken.address,
        sellAmount
      }),
    { retries: 2, baseDelayMs: 500, maxDelayMs: 3000 }
  );

  await ensureAllowance({
    wallet: params.wallet,
    token: params.market.baseToken.address,
    spender: quote.allowanceTarget,
    amount: BigInt(quote.sellAmount)
  });

  if (config.dryRun) {
    return {
      txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      entryPrice: params.market.price,
      sizeUsd: params.notionalUsd,
      receivedAmount: quote.buyAmount
    };
  }

  const txHash = await params.wallet.walletClient.sendTransaction({
    account: params.wallet.account,
    to: quote.to,
    data: quote.data,
    value: BigInt(quote.value)
  });
  await params.wallet.publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    entryPrice: params.market.price,
    sizeUsd: params.notionalUsd,
    receivedAmount: quote.buyAmount
  };
};

export const executeSell = async (params: {
  wallet: WalletContext;
  market: Market;
  sellFraction: number;
}): Promise<TradeExecution> => {
  const balance = await params.wallet.publicClient.readContract({
    address: params.market.quoteToken.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [params.wallet.address]
  });

  const amountToSell = BigInt(Math.floor(Number(balance) * params.sellFraction));
  if (amountToSell <= 0n) {
    throw new Error("Insufficient token balance to sell");
  }

  const quote = await withRetry(
    () =>
      fetchZeroXQuote({
        sellToken: params.market.quoteToken.address,
        buyToken: params.market.baseToken.address,
        sellAmount: amountToSell.toString()
      }),
    { retries: 2, baseDelayMs: 500, maxDelayMs: 3000 }
  );

  await ensureAllowance({
    wallet: params.wallet,
    token: params.market.quoteToken.address,
    spender: quote.allowanceTarget,
    amount: amountToSell
  });

  if (config.dryRun) {
    return {
      txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      entryPrice: params.market.price,
      sizeUsd: Number(quote.buyAmount),
      receivedAmount: quote.buyAmount
    };
  }

  const txHash = await params.wallet.walletClient.sendTransaction({
    account: params.wallet.account,
    to: quote.to,
    data: quote.data,
    value: BigInt(quote.value)
  });
  await params.wallet.publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    entryPrice: params.market.price,
    sizeUsd: Number(quote.buyAmount),
    receivedAmount: quote.buyAmount
  };
};
