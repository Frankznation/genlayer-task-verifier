import fs from "fs";
import path from "path";
import solc from "solc";
import { createWalletContext } from "../src/blockchain/wallet";
import { createLogger } from "../src/utils/logger";

const logger = createLogger("info");

const contractPath = path.resolve("contracts", "CrabTradeNFT.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "CrabTradeNFT.sol": { content: source }
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"]
      }
    }
  }
};

const findImports = (importPath: string) => {
  try {
    const resolvedPath = path.resolve("node_modules", importPath);
    const contents = fs.readFileSync(resolvedPath, "utf8");
    return { contents };
  } catch (error) {
    return { error: `Unable to resolve import: ${importPath}` };
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
if (output.errors?.length) {
  const errors = output.errors.filter((err: any) => err.severity === "error");
  if (errors.length) {
    throw new Error(errors.map((err: any) => err.formattedMessage).join("\n"));
  }
}

const contract = output.contracts["CrabTradeNFT.sol"]["CrabTradeNFT"];
const abi = contract.abi;
const bytecode = `0x${contract.evm.bytecode.object}`;

const deploy = async () => {
  const wallet = createWalletContext();
  logger.info("Deploying CrabTradeNFT...");

  const hash = await wallet.walletClient.deployContract({
    abi,
    bytecode,
    args: ["CrabTradeNFT", "CRAB"]
  });

  const receipt = await wallet.publicClient.waitForTransactionReceipt({ hash });
  logger.info("Deployment complete", { address: receipt.contractAddress, txHash: hash });
};

deploy().catch((error) => {
  logger.error("Deployment failed", { error: error instanceof Error ? error.message : error });
  process.exit(1);
});
