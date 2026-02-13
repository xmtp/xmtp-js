import type { WalletSendCalls } from "@xmtp/node-sdk";
import {
  createPublicClient,
  encodeFunctionData,
  http,
  toHex,
  type Chain,
  type Hex,
  type Transport,
} from "viem";

/**
 * Minimal ERC-20 ABI containing transfer, balanceOf, and decimals functions.
 * Can be used with viem's encodeFunctionData for custom ERC-20 interactions.
 *
 * @see https://eips.ethereum.org/EIPS/eip-20#methods
 */
export const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

export type CreateERC20TransferCallsOptions = {
  /** The viem Chain object (e.g., baseSepolia from "viem/chains"). */
  chain: Chain;
  /** The ERC-20 token contract address (e.g., Base Token Contract List: https://basescan.org/tokens). */
  tokenAddress: Hex;
  /** The sender's address. */
  from: Hex;
  /** The recipient's address. */
  to: Hex;
  /** The amount to transfer in the token's base units (e.g., 1_000_000 for 1 USDC). */
  amount: bigint;
  /** Description that will be shown in the app with the transaction. */
  description: string;
};

export type CreateNativeTransferCallsOptions = Omit<
  CreateERC20TransferCallsOptions,
  "tokenAddress"
>;

export type GetERC20BalanceOptions = {
  /** The viem Chain object. */
  chain: Chain;
  /** The ERC-20 token contract address. */
  tokenAddress: Hex;
  /** The address to query the balance of. */
  address: Hex;
  /** Optional custom viem transport. Defaults to http(). */
  transport?: Transport;
};

export type GetERC20DecimalsOptions = {
  /** The viem Chain object. */
  chain: Chain;
  /** The ERC-20 token contract address. */
  tokenAddress: Hex;
  /** Optional custom viem transport. Defaults to http(). */
  transport?: Transport;
};

/**
 * Creates a WalletSendCalls payload for an ERC-20 token transfer.
 *
 * @param options - The transfer options
 * @returns A WalletSendCalls object ready to send
 */
export function createERC20TransferCalls(
  options: CreateERC20TransferCallsOptions,
): WalletSendCalls {
  const { chain, tokenAddress, from, to, amount, description } = options;

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
  });

  return {
    version: "1.0",
    chainId: toHex(chain.id),
    from,
    calls: [
      {
        to: tokenAddress,
        data,
        value: "0x0",
        metadata: {
          description,
          transactionType: "transfer",
        },
      },
    ],
  };
}

/**
 * Creates a WalletSendCalls payload for a native token transfer (ETH, MATIC, etc.).
 *
 * @param options - The transfer options
 * @returns A WalletSendCalls object ready to send
 */
export function createNativeTransferCalls(
  options: CreateNativeTransferCallsOptions,
): WalletSendCalls {
  const { chain, from, to, amount, description } = options;

  return {
    version: "1.0",
    chainId: toHex(chain.id),
    from,
    calls: [
      {
        to,
        value: toHex(amount),
        metadata: {
          description,
          transactionType: "transfer",
        },
      },
    ],
  };
}

/**
 * Reads the ERC-20 token balance for a given address from the blockchain.
 *
 * @param options - The query options including chain, token address, and wallet address
 * @returns The token balance in base units as a bigint
 */
export async function getERC20Balance(
  options: GetERC20BalanceOptions,
): Promise<bigint> {
  const { chain, tokenAddress, address, transport: customTransport } = options;

  const client = createPublicClient({
    chain,
    transport: customTransport ?? http(),
  });

  return client.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

/**
 * Reads the number of decimals for an ERC-20 token from the blockchain.
 *
 * @param options - The query options including chain and token address
 * @returns The number of decimals (typically 6 or 18)
 */
export async function getERC20Decimals(
  options: GetERC20DecimalsOptions,
): Promise<number> {
  const { chain, tokenAddress, transport: customTransport } = options;

  const client = createPublicClient({
    chain,
    transport: customTransport ?? http(),
  });

  return client.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
  });
}
