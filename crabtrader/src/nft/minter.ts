import { parseEventLogs } from "viem";
import { crabTradeNftAbi, getNftContractAddress } from "../blockchain/contracts";
import type { WalletContext } from "../blockchain/wallet";

const PRICE_DECIMALS = 6;

const priceToUint = (price: number) => {
  return BigInt(Math.round(price * 10 ** PRICE_DECIMALS));
};

export const maybeMintTradeNft = async (params: {
  wallet: WalletContext;
  marketName: string;
  position: string;
  entryPrice: number;
  exitPrice: number;
  pnlBps: number;
  timestamp: number;
  commentary: string;
}) => {
  const contractAddress = getNftContractAddress();
  const notable = await params.wallet.publicClient.readContract({
    address: contractAddress,
    abi: crabTradeNftAbi,
    functionName: "isNotableTrade",
    args: [BigInt(params.pnlBps)]
  });

  if (!notable) return null;

  const hash = await params.wallet.walletClient.writeContract({
    address: contractAddress,
    abi: crabTradeNftAbi,
    functionName: "mintTrade",
    args: [
      params.wallet.address,
      params.marketName,
      params.position,
      priceToUint(params.entryPrice),
      priceToUint(params.exitPrice),
      BigInt(params.pnlBps),
      BigInt(params.timestamp),
      params.commentary
    ]
  });

  const receipt = await params.wallet.publicClient.waitForTransactionReceipt({
    hash
  });

  const parsedLogs = parseEventLogs({
    abi: crabTradeNftAbi,
    logs: receipt.logs,
    eventName: "TradeMinted"
  });

  const tokenId = parsedLogs[0]?.args?.tokenId?.toString() ?? "";

  return {
    tokenId,
    txHash: hash
  };
};
