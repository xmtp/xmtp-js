import { IdentifierKind, type Identifier } from "@xmtp/node-bindings";
import {
  Client,
  HistorySyncUrls,
  type ClientOptions,
  type Signer,
} from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export const createSigner = (key?: `0x${string}`): Signer => {
  const account = privateKeyToAccount(key ?? generatePrivateKey());
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

export const buildClient = async (
  identifier: Identifier,
  options?: ClientOptions,
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  return Client.build(identifier, {
    ...opts,
    dbPath: opts.dbPath ?? `./bench-${identifier.identifier}.db3`,
  });
};

export const createClient = async (signer: Signer, options?: ClientOptions) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  return Client.create(signer, {
    ...opts,
    historySyncUrl: HistorySyncUrls.local,
  });
};
