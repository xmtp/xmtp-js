import { validHex, type HexString } from "@xmtp/agent-sdk";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { createPublicClient, formatUnits, http, toHex } from "viem";
import { base, baseSepolia } from "viem/chains";

export type NetworkConfig = {
  tokenAddress: HexString;
  chainId: HexString;
  decimals: number;
  networkName: string;
  networkId: string;
};

export const USDC_NETWORKS: NetworkConfig[] = [
  {
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    chainId: toHex(84532),
    decimals: 6,
    networkName: "Base Sepolia",
    networkId: "base-sepolia",
  },
  {
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainId: toHex(8453),
    decimals: 6,
    networkName: "Base Mainnet",
    networkId: "base-mainnet",
  },
];

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
  const config = USDC_NETWORKS.find((n) => n.networkId === networkId);
  if (!config) throw new Error(`Network configuration not found: ${networkId}`);
  return config;
};

export const getUSDCBalance = async (
  networkId: string,
  address: HexString,
): Promise<string> => {
  const config = getNetworkConfig(networkId);
  const client = createPublicClient({
    chain: networkId === "base-mainnet" ? base : baseSepolia,
    transport: http(),
  });
  const balance = await client.readContract({
    address: config.tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
  return formatUnits(balance, config.decimals);
};

export const createUSDCTransferCalls = (
  networkId: string,
  fromAddress: HexString,
  recipientAddress: string,
  amount: number,
): WalletSendCallsParams => {
  const config = getNetworkConfig(networkId);
  const data = `0xa9059cbb${recipientAddress.slice(2).padStart(64, "0")}${BigInt(amount).toString(16).padStart(64, "0")}`;
  return {
    version: "1.0",
    from: fromAddress,
    chainId: config.chainId,
    calls: [
      {
        to: config.tokenAddress,
        data: validHex(data),
        metadata: {
          description: `Transfer ${amount / Math.pow(10, config.decimals)} USDC on ${config.networkName}`,
          transactionType: "transfer",
          currency: "USDC",
          amount: amount.toString(),
          decimals: config.decimals.toString(),
          networkId: config.networkId,
        },
      },
    ],
  };
};
