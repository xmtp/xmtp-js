export type SignMessage = (message: string) => Promise<Uint8Array> | Uint8Array;
export type GetAddress = () => Promise<string> | string;
export type GetChainId = () => bigint;
export type GetBlockNumber = () => bigint;
export type WalletType = () => 'EOA' | 'SCW'

export type Signer = {
  getAddress: GetAddress;
  signMessage: SignMessage;
  walletType?: WalletType;
  getBlockNumber?: GetBlockNumber;
  getChainId?: GetChainId;
};

export type SmartContractSigner = Required<Signer>;

export const isSmartContractSigner = (
  signer: Signer,
): signer is SmartContractSigner =>
  signer.walletType?.() === 'SCW';
  
