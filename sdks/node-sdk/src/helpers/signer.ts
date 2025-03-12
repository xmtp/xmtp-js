import type { Identifier } from "@xmtp/node-bindings";

export type SignMessage = (message: string) => Promise<SignedData> | SignedData;
export type GetIdentifier = () => Promise<Identifier> | Identifier;
export type GetChainId = () => bigint;
export type GetBlockNumber = () => bigint;

export interface SignedData {
  signature: Uint8Array;
  publicKey?: Uint8Array; // Used for Passkeys
  authenticatorData?: Uint8Array; // WebAuthn metadata
  clientDataJson?: Uint8Array; // WebAuthn metadata
}

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
    }
  | {
      type: "PASSKEY";
      signMessage: SignMessage;
      getIdentifier: GetIdentifier;
    };

export type EOASigner = Extract<Signer, { type: "EOA" }>;
export type SCWSigner = Extract<Signer, { type: "SCW" }>;
export type PASSKEYSigner = Extract<Signer, { type: "PASSKEY" }>;
