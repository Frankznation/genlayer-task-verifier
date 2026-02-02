import type { Address } from "viem";
import { config } from "../config/env";

export const crabTradeNftAbi = [
  {
    type: "event",
    name: "TradeMinted",
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "market", type: "string" },
      { indexed: false, name: "pnlBps", type: "int256" }
    ]
  },
  {
    type: "function",
    name: "mintTrade",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "market", type: "string" },
      { name: "position", type: "string" },
      { name: "entryPrice", type: "uint256" },
      { name: "exitPrice", type: "uint256" },
      { name: "pnlBps", type: "int256" },
      { name: "timestamp", type: "uint256" },
      { name: "commentary", type: "string" }
    ],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  {
    type: "function",
    name: "isNotableTrade",
    stateMutability: "view",
    inputs: [{ name: "pnlBps", type: "int256" }],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export const getNftContractAddress = (): Address => {
  if (!config.nftContractAddress) {
    throw new Error("NFT_CONTRACT_ADDRESS is not configured");
  }
  return config.nftContractAddress as Address;
};
