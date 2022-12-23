export interface Signer {
  getAddress(): Promise<string>
  signMessage(message: ArrayLike<number> | string): Promise<string>
}
