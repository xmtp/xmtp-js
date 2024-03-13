import { privateKey as proto } from '@xmtp/proto'
import { getAddress, hexToBytes, verifyMessage, type Hex } from 'viem'
import LocalAuthenticator from '@/authn/LocalAuthenticator'
import type { PreEventCallback } from '@/Client'
import Ciphertext from '@/crypto/Ciphertext'
import crypto from '@/crypto/crypto'
import { decrypt, encrypt } from '@/crypto/encryption'
import {
  decodePrivateKeyBundle,
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from '@/crypto/PrivateKeyBundle'
import { bytesToHex } from '@/crypto/utils'
import type TopicPersistence from '@/keystore/persistence/TopicPersistence'
import type { Signer } from '@/types/Signer'

const KEY_BUNDLE_NAME = 'key_bundle'
/**
 * EncryptedKeyStore wraps Store to enable encryption of private key bundles
 * using a wallet signature.
 */
export default class NetworkKeyManager {
  private persistence: TopicPersistence
  private signer: Signer
  private preEnableIdentityCallback?: PreEventCallback

  constructor(
    signer: Signer,
    persistence: TopicPersistence,
    preEnableIdentityCallback?: PreEventCallback
  ) {
    this.signer = signer
    this.persistence = persistence
    this.preEnableIdentityCallback = preEnableIdentityCallback
  }

  private async getStorageAddress(name: string): Promise<string> {
    // I think we want to namespace the storage address by wallet
    // This will allow us to support switching between multiple wallets in the same browser
    let walletAddress = await this.signer.getAddress()
    walletAddress = getAddress(walletAddress)
    return `${walletAddress}/${name}`
  }

  // Retrieve a private key bundle for the active wallet address in the signer
  async loadPrivateKeyBundle(): Promise<PrivateKeyBundleV1 | null> {
    const storageBuffer = await this.persistence.getItem(
      await this.getStorageAddress(KEY_BUNDLE_NAME)
    )
    if (!storageBuffer) {
      return null
    }

    const [bundle, needsUpdate] = await this.fromEncryptedBytes(
      this.signer,
      Uint8Array.from(storageBuffer)
    )
    // If a versioned bundle is not found, the legacy bundle needs to be resaved to the store in
    // the new format. Once all bundles have been upgraded, this migration code can be removed.
    if (needsUpdate) {
      await this.storePrivateKeyBundle(bundle)
    }
    return bundle
  }

  // Store the private key bundle at an address generated based on the active wallet in the signer
  async storePrivateKeyBundle(bundle: PrivateKeyBundleV1): Promise<void> {
    const keyAddress = await this.getStorageAddress(KEY_BUNDLE_NAME)
    const encodedBundle = await this.toEncryptedBytes(bundle, this.signer)
    // We need to setup the Authenticator so that the underlying store can publish messages without error
    if (typeof this.persistence.setAuthenticator === 'function') {
      this.persistence.setAuthenticator(
        new LocalAuthenticator(bundle.identityKey)
      )
    }

    await this.persistence.setItem(keyAddress, encodedBundle)
  }

  // encrypts/serializes the bundle for storage
  async toEncryptedBytes(
    bundle: PrivateKeyBundleV1,
    wallet: Signer
  ): Promise<Uint8Array> {
    // serialize the contents
    const bytes = bundle.encode()
    const wPreKey = crypto.getRandomValues(new Uint8Array(32))
    const input = storageSigRequestText(wPreKey)
    const walletAddr = await wallet.getAddress()
    if (this.preEnableIdentityCallback) {
      await this.preEnableIdentityCallback()
    }
    const sig = await wallet.signMessage(input)

    // Check that the signature is correct, was created using the expected
    // input, and retry if not. This mitigates a bug in interacting with
    // LedgerLive for iOS, where the previous signature response is
    // returned in some cases.
    const valid = verifyMessage({
      address: walletAddr as `0x${string}`,
      message: input,
      signature: sig as Hex,
    })

    if (!valid) {
      throw new Error('invalid signature')
    }

    const secret = hexToBytes(sig as Hex)
    const ciphertext = await encrypt(bytes, secret)
    return proto.EncryptedPrivateKeyBundle.encode({
      v1: {
        walletPreKey: wPreKey,
        ciphertext,
      },
    }).finish()
  }

  // decrypts/deserializes the bundle from storage bytes
  async fromEncryptedBytes(
    wallet: Signer,
    bytes: Uint8Array
  ): Promise<[PrivateKeyBundleV1, boolean]> {
    const [eBundle, needsUpdate] = getEncryptedBundle(bytes)

    if (!eBundle.walletPreKey) {
      throw new Error('missing wallet pre-key')
    }
    if (!eBundle.ciphertext?.aes256GcmHkdfSha256) {
      throw new Error('missing bundle ciphertext')
    }

    if (this.preEnableIdentityCallback) {
      await this.preEnableIdentityCallback()
    }
    const secret = hexToBytes(
      (await wallet.signMessage(
        storageSigRequestText(eBundle.walletPreKey)
      )) as Hex
    )

    // Ledger uses the last byte = v=[0,1,...] but Metamask and other wallets generate with
    // v+27 as the last byte. We need to support both for interoperability. Doing this
    // on the decryption side provides an immediate retroactive fix.
    // Ledger is using the canonical way, whereas Ethereum adds 27 due to some legacy stuff
    // https://github.com/ethereum/go-ethereum/issues/19751#issuecomment-504900739
    try {
      // Try the original version of the signature first
      const ciphertext = new Ciphertext(eBundle.ciphertext)
      const decrypted = await decrypt(ciphertext, secret)
      const [bundle, needsUpdate2] = getPrivateBundle(decrypted)
      return [bundle, needsUpdate || needsUpdate2]
    } catch (e) {
      // Assert that the secret is length 65 (encoded signature + recovery byte)
      if (secret.length !== 65) {
        throw new Error(
          'Expected 65 bytes before trying a different recovery byte'
        )
      }
      // Try the other version of recovery byte, either +27 or -27
      const lastByte = secret[secret.length - 1]
      let newSecret = secret.slice(0, secret.length - 1)
      if (lastByte < 27) {
        // This is a canonical signature, so we need to add 27 to the recovery byte and try again
        newSecret = new Uint8Array([...newSecret, lastByte + 27])
      } else {
        // This canocalizes v to 0 or 1 (or maybe 2 or 3 but very unlikely)
        newSecret = new Uint8Array([...newSecret, lastByte - 27])
      }
      const ciphertext = new Ciphertext(eBundle.ciphertext)
      const decrypted = await decrypt(ciphertext, newSecret)
      const [bundle, needsUpdate2] = getPrivateBundle(decrypted)
      return [bundle, needsUpdate || needsUpdate2]
    }
  }
}

// getEncryptedV1Bundle returns the decoded bundle from the provided bytes. If there is an error decoding the bundle it attempts
// to decode the bundle as a legacy bundle. Additionally return whether the bundle is in the expected format.
function getEncryptedBundle(
  bytes: Uint8Array
): [proto.EncryptedPrivateKeyBundleV1, boolean] {
  try {
    const b = proto.EncryptedPrivateKeyBundle.decode(bytes)
    if (b.v1) {
      return [b.v1, false]
    }
  } catch (e) {
    return [proto.EncryptedPrivateKeyBundleV1.decode(bytes), true]
  }
  throw new Error('unrecognized encrypted private key bundle version')
}

// getPrivateV1Bundle returns the decoded bundle from the provided bytes. If there is an error decoding the bundle it attempts
// to decode the bundle as a legacy bundle. Additionally return whether the bundle is in the expected format.
function getPrivateBundle(bytes: Uint8Array): [PrivateKeyBundleV1, boolean] {
  try {
    // TODO: add support for V2
    const b = decodePrivateKeyBundle(bytes)
    if (b instanceof PrivateKeyBundleV2) {
      throw new Error('V2 bundles not supported yet')
    }
    return [b, false]
  } catch (e) {
    // Adds a default fallback for older versions of the proto
    const b = proto.PrivateKeyBundleV1.decode(bytes)
    return [new PrivateKeyBundleV1(b), true]
  }
}

export function storageSigRequestText(preKey: Uint8Array): string {
  // Note that an update to this signature request text will require
  // addition of backward compatibility for existing encrypted bundles
  // and/or a migration; otherwise clients will no longer be able to
  // decrypt those bundles.
  return (
    'XMTP : Enable Identity\n' +
    `${bytesToHex(preKey)}\n` +
    '\n' +
    'For more info: https://xmtp.org/signatures/'
  )
}
