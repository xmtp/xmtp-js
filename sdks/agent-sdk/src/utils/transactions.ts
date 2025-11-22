import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { validHex, type HexString } from "@xmtp/node-sdk";
import { createPublicClient, formatUnits, http, toHex } from "viem";
import { base, baseSepolia } from "viem/chains";

export type TokenConfig = {
  tokenAddress: HexString;
  decimals: number;
  symbol: string;
};

export type NetworkConfig = {
  chainId: HexString;
  networkName: string;
  networkId: string;
};

export const NETWORKS: NetworkConfig[] = [
  {
    chainId: toHex(84532),
    networkName: "Base Sepolia",
    networkId: "base-sepolia",
  },
  {
    chainId: toHex(8453),
    networkName: "Base Mainnet",
    networkId: "base-mainnet",
  },
];

export const USDC_TOKENS: Record<string, TokenConfig> = {
  "base-sepolia": {
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    symbol: "USDC",
  },
  "base-mainnet": {
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    symbol: "USDC",
  },
};

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const getNetworkConfig = (networkId: string): NetworkConfig => {
  const config = NETWORKS.find((n) => n.networkId === networkId);
  if (!config) throw new Error(`Network configuration not found: ${networkId}`);
  return config;
};

export const getTokenBalance = async (
  networkId: string,
  tokenConfig: TokenConfig,
  address: HexString,
): Promise<string> => {
  const client = createPublicClient({
    chain: networkId === "base-mainnet" ? base : baseSepolia,
    transport: http(),
  });
  const balance = await client.readContract({
    address: tokenConfig.tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
  return formatUnits(balance, tokenConfig.decimals);
};

export const createTokenTransferCalls = (
  networkId: string,
  tokenConfig: TokenConfig,
  fromAddress: HexString,
  recipientAddress: string,
  amount: number,
): WalletSendCallsParams => {
  const networkConfig = getNetworkConfig(networkId);
  const data = `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${BigInt(amount).toString(16).padStart(64, "0")}`;
  return {
    version: "1.0",
    from: fromAddress,
    chainId: networkConfig.chainId,
    calls: [
      {
        to: tokenConfig.tokenAddress,
        data: validHex(data),
        metadata: {
          description: `Transfer ${amount / Math.pow(10, tokenConfig.decimals)} ${tokenConfig.symbol} on ${networkConfig.networkName}`,
          transactionType: "transfer",
          currency: tokenConfig.symbol,
          amount: amount.toString(),
          decimals: tokenConfig.decimals.toString(),
          networkId: networkConfig.networkId,
        },
      },
    ],
  };
};

export const getUSDCBalance = async (
  networkId: string,
  address: HexString,
): Promise<string> => {
  const tokenConfig = USDC_TOKENS[networkId];
  if (!tokenConfig)
    throw new Error(`USDC token not found for network: ${networkId}`);
  return getTokenBalance(networkId, tokenConfig, address);
};

export const createUSDCTransferCalls = (
  networkId: string,
  fromAddress: HexString,
  recipientAddress: string,
  amount: number,
): WalletSendCallsParams => {
  const tokenConfig = USDC_TOKENS[networkId];
  if (!tokenConfig)
    throw new Error(`USDC token not found for network: ${networkId}`);
  return createTokenTransferCalls(
    networkId,
    tokenConfig,
    fromAddress,
    recipientAddress,
    amount,
  );
};
