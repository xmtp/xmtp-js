import { IdentifierKind, type Identifier } from "@xmtp/wasm-bindings";
import { toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

type SignMessage = (message: string) => Promise<Uint8Array> | Uint8Array;
type GetIdentifier = () => Promise<Identifier> | Identifier;
type GetChainId = () => bigint;
type GetBlockNumber = () => bigint;

export type Signer =
  | {
      type: "EOA";
      getIdentifier: GetIdentifier;
      signMessage: SignMessage;
    }
  | {
      type: "SCW";
      getIdentifier: GetIdentifier;
      signMessage: SignMessage;
      getBlockNumber?: GetBlockNumber;
      getChainId: GetChainId;
    };

export type EOASigner = Extract<Signer, { type: "EOA" }>;
export type SCWSigner = Extract<Signer, { type: "SCW" }>;

export type SafeSigner =
  | {
      type: "EOA";
      identifier: Identifier;
      signature: Uint8Array;
    }
  | {
      type: "SCW";
      identifier: Identifier;
      signature: Uint8Array;
      chainId: bigint;
      blockNumber?: bigint;
    };

export const createEOASigner = (key = generatePrivateKey()): Signer => {
  const account = privateKeyToAccount(key);
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: account.address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await account.signMessage({ message });
      return toBytes(signature);
    },
  };
};

export const createSCWSigner = (
  address: `0x${string}`,
  signMessage: (message: string) => Promise<string> | string,
  chainId: bigint,
): Signer => {
  return {
    type: "SCW",
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await signMessage(message);
      return toBytes(signature);
    },
    getChainId: () => chainId,
  };
};

export const toSafeSigner = async (
  signer: Signer,
  signature: Uint8Array,
): Promise<SafeSigner> => {
  switch (signer.type) {
    case "EOA":
      return {
        type: "EOA",
        identifier: await signer.getIdentifier(),
        signature,
      };
    case "SCW":
      return {
        type: "SCW",
        identifier: await signer.getIdentifier(),
        signature,
        chainId: signer.getChainId(),
        blockNumber: signer.getBlockNumber?.(),
      };
  }
};
