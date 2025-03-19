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
