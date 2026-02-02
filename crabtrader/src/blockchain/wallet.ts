import { createPublicClient, createWalletClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { base } from "viem/chains";
import { config } from "../config/env";

export interface WalletContext {
  address: Address;
  account: PrivateKeyAccount;
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
}

export const createWalletContext = (): WalletContext => {
  const account = privateKeyToAccount(config.privateKey as Hex);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(config.baseRpcUrl)
  });

  const walletClient = createWalletClient({
    chain: base,
    transport: http(config.baseRpcUrl),
    account
  });

  return {
    address: account.address,
    account,
    publicClient,
    walletClient
  };
};
