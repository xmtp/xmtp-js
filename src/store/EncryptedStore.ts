import { Store } from './Store'
import { Signer } from 'ethers'
import { PrivateKeyBundle } from '../crypto'
import { BundleUpgradeNeeded } from '../crypto/PrivateKeyBundle'
import { KeyStore } from './KeyStore'
import { Authenticator } from '../authn'

const KEY_BUNDLE_NAME = 'key_bundle'
/**
 * EncryptedStore is an abstraction on top of the generic Store which enables the decryption and decoding
 * of specific data types.
 *
 * Currently supports:
 * - PrivateKeyBundle
 */
export default class EncryptedStore implements KeyStore {
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

  // Retrieve a private key bundle for the active wallet address in the signer
  async loadPrivateKeyBundle(): Promise<PrivateKeyBundle | null> {
    const storageBuffer = await this.store.get(
      await this.getStorageAddress(KEY_BUNDLE_NAME)
    )
    if (!storageBuffer) {
      return null
    }

    try {
      return await PrivateKeyBundle.fromEncryptedBytes(
        this.signer,
        Uint8Array.from(storageBuffer)
      )
    } catch (e) {
      // If a versioned bundle is not found, the legacy bundle needs to be resaved to the store in
      // the new format. Once all bundles have been upgraded, this migration code can be removed.
      if (e instanceof BundleUpgradeNeeded) {
        const bundle = (e as BundleUpgradeNeeded).bundle
        await this.storePrivateKeyBundle(bundle)
        return bundle
      }
      throw e
    }
  }

  // Store the private key bundle at an address generated based on the active wallet in the signer
  async storePrivateKeyBundle(bundle: PrivateKeyBundle): Promise<void> {
    const keyAddress = await this.getStorageAddress(KEY_BUNDLE_NAME)
    const encodedBundle = await bundle.toEncryptedBytes(this.signer)
    // We need to setup the Authenticator so that the underlying store can publish messages without error
    if (typeof this.store.setAuthenticator === 'function') {
      this.store.setAuthenticator(new Authenticator(bundle.identityKey))
    }
    await this.store.set(keyAddress, Buffer.from(encodedBundle))
  }
}
