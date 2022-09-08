import { privateKey as proto } from '@xmtp/proto'
import { PrivateKey } from './PrivateKey'
import { PublicKey } from './PublicKey'
import PublicKeyBundle from './PublicKeyBundle'
import Ciphertext from './Ciphertext'
import { Signer } from 'ethers'
import { bytesToHex, getRandomValues, hexToBytes } from './utils'
import { decrypt, encrypt } from './encryption'
import { NoMatchingPreKeyError } from './errors'

// PrivateKeyBundle bundles the private keys corresponding to a PublicKeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.
export default class PrivateKeyBundle implements proto.PrivateKeyBundleV1 {
  identityKey: PrivateKey
  preKeys: PrivateKey[]

  constructor(identityKey: PrivateKey, preKeys?: PrivateKey[]) {
    this.identityKey = identityKey
    this.preKeys = preKeys || []
  }

  // Generate a new key bundle with the preKey signed byt the identityKey.
  // Optionally sign the identityKey with the provided wallet as well.
  static async generate(wallet?: Signer): Promise<PrivateKeyBundle> {
    const identityKey = PrivateKey.generate()
    if (wallet) {
      await identityKey.publicKey.signWithWallet(wallet)
    }
    const bundle = new PrivateKeyBundle(identityKey)
    await bundle.addPreKey()
    return bundle
  }

  // Return the current (latest) pre-key (to be advertised).
  getCurrentPreKey(): PrivateKey {
    return this.preKeys[0]
  }

  // Find pre-key matching the provided public key.
  findPreKey(which: PublicKey): PrivateKey {
    const preKey = this.preKeys.find((key) => key.matches(which))
    if (!preKey) {
      throw new NoMatchingPreKeyError()
    }
    return preKey
  }

  // Generate a new pre-key to be used as the current pre-key.
  async addPreKey(): Promise<void> {
    const preKey = PrivateKey.generate()
    await this.identityKey.signKey(preKey.publicKey)
    this.preKeys.unshift(preKey)
  }

  // Return a key bundle with the current pre-key.
  getPublicKeyBundle(): PublicKeyBundle {
    return new PublicKeyBundle(
      this.identityKey.publicKey,
      this.getCurrentPreKey().publicKey
    )
  }

  // sharedSecret derives a secret from peer's key bundles using a variation of X3DH protocol
  // where the sender's ephemeral key pair is replaced by the sender's pre-key.
  // @peer is the peer's public key bundle
  // @myPreKey indicates which of my preKeys should be used to derive the secret
  // @recipient indicates if this is the sending or receiving side.
  async sharedSecret(
    peer: PublicKeyBundle,
    myPreKey: PublicKey,
    isRecipient: boolean
  ): Promise<Uint8Array> {
    if (!peer.identityKey || !peer.preKey) {
      throw new Error('invalid peer key bundle')
    }
    if (!(await peer.identityKey.verifyKey(peer.preKey))) {
      throw new Error('peer preKey signature invalid')
    }
    if (!this.identityKey) {
      throw new Error('missing identity key')
    }
    let dh1: Uint8Array, dh2: Uint8Array, preKey: PrivateKey
    if (isRecipient) {
      preKey = this.findPreKey(myPreKey)
      dh1 = preKey.sharedSecret(peer.identityKey)
      dh2 = this.identityKey.sharedSecret(peer.preKey)
    } else {
      preKey = this.findPreKey(myPreKey)
      dh1 = this.identityKey.sharedSecret(peer.preKey)
      dh2 = preKey.sharedSecret(peer.identityKey)
    }
    const dh3 = preKey.sharedSecret(peer.preKey)
    const secret = new Uint8Array(dh1.length + dh2.length + dh3.length)
    secret.set(dh1, 0)
    secret.set(dh2, dh1.length)
    secret.set(dh3, dh1.length + dh2.length)
    return secret
  }

  static storageSigRequestText(preKey: Uint8Array): string {
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

  // encrypts/serializes the bundle for storage
  async toEncryptedBytes(wallet: Signer): Promise<Uint8Array> {
    // serialize the contents
    if (this.preKeys.length === 0) {
      throw new Error('missing pre-keys')
    }
    if (!this.identityKey) {
      throw new Error('missing identity key')
    }
    const bytes = proto.PrivateKeyBundle.encode({
      v1: {
        identityKey: this.identityKey,
        preKeys: this.preKeys,
      },
      v2: undefined,
    }).finish()
    const wPreKey = getRandomValues(new Uint8Array(32))
    const secret = hexToBytes(
      await wallet.signMessage(PrivateKeyBundle.storageSigRequestText(wPreKey))
    )
    const ciphertext = await encrypt(bytes, secret)
    return proto.EncryptedPrivateKeyBundle.encode({
      v1: {
        walletPreKey: wPreKey,
        ciphertext,
      },
    }).finish()
  }

  encode(): Uint8Array {
    return proto.PrivateKeyBundle.encode({ v1: this, v2: undefined }).finish()
  }

  static decode(bytes: Uint8Array): PrivateKeyBundle {
    const [protoVal] = getPrivateV1Bundle(bytes)
    if (!protoVal || !protoVal.identityKey || !protoVal.preKeys.length) {
      throw new Error('Decode failure')
    }
    return new PrivateKeyBundle(
      new PrivateKey(protoVal.identityKey),
      protoVal.preKeys.map((protoKey) => new PrivateKey(protoKey))
    )
  }

  // decrypts/deserializes the bundle from storage bytes
  static async fromEncryptedBytes(
    wallet: Signer,
    bytes: Uint8Array
  ): Promise<PrivateKeyBundle> {
    const [eBundle, needsUpdateA] = getEncryptedV1Bundle(bytes)

    if (!eBundle) {
      throw new Error('invalid bundle version')
    }

    if (!eBundle.walletPreKey) {
      throw new Error('missing wallet pre-key')
    }
    const secret = hexToBytes(
      await wallet.signMessage(
        PrivateKeyBundle.storageSigRequestText(eBundle.walletPreKey)
      )
    )
    if (!eBundle?.ciphertext?.aes256GcmHkdfSha256) {
      throw new Error('missing bundle ciphertext')
    }
    const ciphertext = new Ciphertext(eBundle.ciphertext)
    const decrypted = await decrypt(ciphertext, secret)
    const [bundle, needsUpdateB] = getPrivateV1Bundle(decrypted)

    if (!bundle) {
      throw new Error('could not decode bundle')
    }

    if (!bundle.identityKey) {
      throw new Error('missing identity key')
    }
    if (bundle.preKeys.length === 0) {
      throw new Error('missing pre-keys')
    }

    const retBundle = new PrivateKeyBundle(
      new PrivateKey(bundle.identityKey),
      bundle.preKeys.map((protoKey) => new PrivateKey(protoKey))
    )

    // If either the EncryptedPrivateKeyBundle or the PrivateKeyBundle are in the legacy format, then signal to the caller to
    // update the bundle in the store. The valid bundle is included in the error, so it does not need to be parsed again.
    if (needsUpdateA || needsUpdateB) {
      throw new BundleUpgradeNeeded(retBundle)
    }

    return retBundle
  }
}

export class BundleUpgradeNeeded extends Error {
  bundle: PrivateKeyBundle
  constructor(bundle: PrivateKeyBundle) {
    super('BundleFormatIsOutdated')
    this.bundle = bundle
  }
}

// getEncryptedV1Bundle returns the decoded bundle from the provided bytes. If there is an error decoding the bundle it attempts
// to decode the bundle as a legacy bundle. Additionally return whether the bundle is in the expected format.
function getEncryptedV1Bundle(
  bytes: Uint8Array
): [proto.EncryptedPrivateKeyBundleV1 | undefined, boolean] {
  try {
    const b = proto.EncryptedPrivateKeyBundle.decode(bytes)
    return [b.v1, false]
  } catch (e) {
    if (
      e instanceof RangeError ||
      (e instanceof Error && e.message.startsWith('invalid wire type'))
    ) {
      // Adds a default fallback for older versions of the KeyBundles
      return [proto.EncryptedPrivateKeyBundleV1.decode(bytes), true]
    }
    throw new Error("Couldn't decode encrypted bundle:" + e)
  }
}

// getPrivateV1Bundle returns the decoded bundle from the provided bytes. If there is an error decoding the bundle it attempts
// to decode the bundle as a legacy bundle. Additionally return whether the bundle is in the expected format.
function getPrivateV1Bundle(
  bytes: Uint8Array
): [proto.PrivateKeyBundleV1 | undefined, boolean] {
  try {
    const b = proto.PrivateKeyBundle.decode(bytes)
    return [b.v1, false]
  } catch (e) {
    if (
      e instanceof RangeError ||
      (e instanceof Error && e.message.startsWith('invalid wire type'))
    ) {
      // Adds a default fallback for older versions of the proto
      return [proto.PrivateKeyBundleV1.decode(bytes), true]
    }
    throw new Error("Couldn't decode private bundle:" + e)
  }
}
