import type { Identifier } from "@xmtp/node-bindings";

export type SignMessage = (message: string) => Promise<Uint8Array> | Uint8Array;
export type GetIdentifier = () => Promise<Identifier> | Identifier;
export type GetChainId = () => bigint;
export type GetBlockNumber = () => bigint;

export type Signer =
  | {
      type: "EOA";
      signMessage: SignMessage;
      getIdentifier: GetIdentifier;
    }
  | {
      type: "SCW";
      signMessage: SignMessage;
      getIdentifier: GetIdentifier;
      getBlockNumber?: GetBlockNumber;
      getChainId: GetChainId;
    };

export type EOASigner = Extract<Signer, { type: "EOA" }>;
export type SCWSigner = Extract<Signer, { type: "SCW" }>;
