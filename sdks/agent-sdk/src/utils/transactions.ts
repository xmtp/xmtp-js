import { validHex, type HexString } from "@xmtp/agent-sdk";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { createPublicClient, formatUnits, http, toHex } from "viem";
import { base, baseSepolia } from "viem/chains";

export type TokenConfig = {
  tokenAddress: HexString;
  chainId: HexString;
  decimals: number;
  networkName: string;
  networkId: string;
  tokenSymbol: string;
};

export const USDC_NETWORKS: TokenConfig[] = [
  {
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    chainId: toHex(84532),
    decimals: 6,
    networkName: "Base Sepolia",
    networkId: "base-sepolia",
    tokenSymbol: "USDC",
  },
  {
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainId: toHex(8453),
    decimals: 6,
    networkName: "Base Mainnet",
    networkId: "base-mainnet",
    tokenSymbol: "USDC",
  },
];

// Legacy type alias for backward compatibility
export type NetworkConfig = TokenConfig;

const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const getNetworkConfig = (networkId: string): TokenConfig => {
  const config = USDC_NETWORKS.find((n) => n.networkId === networkId);
  if (!config) throw new Error(`Network configuration not found: ${networkId}`);
  return config;
};

const getChain = (networkId: string) => {
  return networkId === "base-mainnet" ? base : baseSepolia;
};

export const getTokenBalance = async (
  tokenConfig: TokenConfig,
  address: HexString,
): Promise<string> => {
  const client = createPublicClient({
    chain: getChain(tokenConfig.networkId),
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

export const getUSDCBalance = async (
  networkId: string,
  address: HexString,
): Promise<string> => {
  const config = getNetworkConfig(networkId);
  return getTokenBalance(config, address);
};

export const createTokenTransferCalls = (
  tokenConfig: TokenConfig,
  fromAddress: HexString,
  recipientAddress: string,
  amount: number,
): WalletSendCallsParams => {
  const data = `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${BigInt(amount).toString(16).padStart(64, "0")}`;
  const formattedAmount = amount / Math.pow(10, tokenConfig.decimals);
  return {
    version: "1.0",
    from: fromAddress,
    chainId: tokenConfig.chainId,
    calls: [
      {
        to: tokenConfig.tokenAddress,
        data: validHex(data),
        metadata: {
          description: `Transfer ${formattedAmount} ${tokenConfig.tokenSymbol} on ${tokenConfig.networkName}`,
          transactionType: "transfer",
          currency: tokenConfig.tokenSymbol,
          amount: amount.toString(),
          decimals: tokenConfig.decimals.toString(),
          networkId: tokenConfig.networkId,
        },
      },
    ],
  };
};

export const createUSDCTransferCalls = (
  networkId: string,
  fromAddress: HexString,
  recipientAddress: string,
  amount: number,
): WalletSendCallsParams => {
  const config = getNetworkConfig(networkId);
  return createTokenTransferCalls(
    config,
    fromAddress,
    recipientAddress,
    amount,
  );
};
