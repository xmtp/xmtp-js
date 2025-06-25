import type { Identifier } from "@xmtp/wasm-bindings";

export type SignMessage = (message: string) => Promise<Uint8Array> | Uint8Array;
export type GetIdentifier = () => Promise<Identifier> | Identifier;
export type GetChainId = () => bigint;
export type GetBlockNumber = () => bigint;

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
