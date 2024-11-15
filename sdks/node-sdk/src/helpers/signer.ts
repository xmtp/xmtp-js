export type SignMessage = (message: string) => Promise<Uint8Array> | Uint8Array;
export type GetAddress = () => Promise<string> | string;
export type GetChainId = () => bigint;
export type GetBlockNumber = () => bigint;

export type Signer = {
  getAddress: GetAddress;
  signMessage: SignMessage;
  // these fields indicate that the signer is a smart contract wallet
  getBlockNumber?: GetBlockNumber;
  getChainId?: GetChainId;
};

export type SmartContractSigner = Required<Signer>;

export const isSmartContractSigner = (
  signer: Signer,
): signer is SmartContractSigner =>
  "getBlockNumber" in signer && "getChainId" in signer;
