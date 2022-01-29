import { Store } from './Store'
import { Signer } from 'ethers'
import { PrivateKeyBundle } from '../crypto'

const KEY_BUNDLE_NAME = 'key_bundle'

export default class EncryptedStore {
  private store: Store
  private signer: Signer

  constructor(signer: Signer, store: Store) {
    this.signer = signer
    this.store = store
  }

  private async getStorageAddress(name: string): Promise<string> {
    // I think we want to namespace the storage address by wallet
    // This will allow us to support switching between multiple wallets in the same browser
    const walletAddress = await this.signer.getAddress()
    return `${walletAddress}/${name}`
  }

  async retrievePrivateKeyBundle(): Promise<PrivateKeyBundle | null> {
    const storageBuffer = await this.store.get(
      await this.getStorageAddress(KEY_BUNDLE_NAME)
    )
    if (!storageBuffer) {
      return null
    }
    return PrivateKeyBundle.decode(this.signer, Uint8Array.from(storageBuffer))
  }

  async storePrivateKeyBundle(bundle: PrivateKeyBundle): Promise<void> {
    const keyAddress = await this.getStorageAddress(KEY_BUNDLE_NAME)
    const encodedBundle = await bundle.encode(this.signer)
    await this.store.set(keyAddress, Buffer.from(encodedBundle))
  }
}
