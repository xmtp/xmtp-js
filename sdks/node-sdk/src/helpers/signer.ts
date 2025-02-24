export type SignMessage = (message: string) => Promise<Uint8Array> | Uint8Array;
export type GetAddress = () => Promise<string> | string;
export type GetChainId = () => bigint;
export type GetBlockNumber = () => bigint;

export type Signer =
  | {
      walletType: "EOA";
      getAddress: GetAddress;
      signMessage: SignMessage;
    }
  | {
      walletType: "SCW";
      getAddress: GetAddress;
      signMessage: SignMessage;
      getBlockNumber?: GetBlockNumber;
      getChainId: GetChainId;
    };
