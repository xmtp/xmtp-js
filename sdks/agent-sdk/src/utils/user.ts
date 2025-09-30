import { escape } from "node:querystring";
import { IdentifierKind, type Identifier, type Signer } from "@xmtp/node-sdk";
import {
  createWalletClient,
  http,
  isAddress,
  toBytes,
  type Chain,
  type Hex,
  type PrivateKeyAccount,
  type WalletClient,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import type { NSResponse } from "web3bio-profile-kit/types";
import { AgentError } from "@/core/AgentError.js";

export type User = {
  key: Hex;
  account: PrivateKeyAccount;
  wallet: WalletClient;
};

export const createUser = (
  key?: `0x${string}`,
  chain: Chain = sepolia,
): User => {
  const accountKey = key ?? generatePrivateKey();
  const account = privateKeyToAccount(accountKey);
  return {
    key: accountKey,
    account,
    wallet: createWalletClient({
      account,
      chain,
      transport: http(),
    }),
  };
};

export const createIdentifier = (user: User): Identifier => ({
  identifier: user.account.address.toLowerCase(),
  identifierKind: IdentifierKind.Ethereum,
});

export const createSigner = (user: User): Signer => {
  const identifier = createIdentifier(user);
  return {
    type: "EOA",
    getIdentifier: () => identifier,
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        account: user.account,
        message,
      });
      return toBytes(signature);
    },
  };
};

export const isValidName = (name: string): boolean => {
  return /^_?[a-zA-Z0-9-]+(\.base)?\.eth$/.test(name);
};

const fetchFromWeb3Bio = async (
  name: string,
  apiKey?: string,
): Promise<NSResponse[]> => {
  const endpoint = `https://api.web3.bio/ns/${escape(name)}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-API-KEY"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new AgentError(2000, "Could not fetch name");
  }

  return response.json() as Promise<NSResponse[]>;
};

const resolveName = async (
  name: string,
  apiKey?: string,
): Promise<string | null> => {
  if (isAddress(name)) {
    return name;
  }

  if (!isValidName(name)) {
    throw new AgentError(
      2001,
      "Invalid name format. Must be a valid ENS (.eth) or Base (.base.eth) name.",
    );
  }

  const response = await fetchFromWeb3Bio(name, apiKey);
  return response[0].address;
};

export const createNameResolver = (apiKey?: string) => {
  return (name: string) => resolveName(name, apiKey);
};
