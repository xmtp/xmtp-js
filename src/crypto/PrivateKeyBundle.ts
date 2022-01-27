import * as proto from '../../src/proto/messaging'
import PrivateKey from './PrivateKey'
import PublicKeyBundle from './PublicKeyBundle'
import Ciphertext from './Ciphertext'
import * as ethers from 'ethers'
import { getRandomValues, hexToBytes } from './utils'
import { decrypt, encrypt } from './encryption'

// PrivateKeyBundle bundles the private keys corresponding to a PublicKeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.
export default class PrivateKeyBundle implements proto.PrivateKeyBundle {
  identityKey: PrivateKey | undefined
  preKeys: PrivateKey[]
  preKey: PrivateKey
  publicKeyBundle: PublicKeyBundle

  constructor(identityKey: PrivateKey, preKey: PrivateKey) {
    this.identityKey = identityKey
    this.preKey = preKey
    this.preKeys = [preKey]
    this.publicKeyBundle = new PublicKeyBundle(
      this.identityKey.publicKey,
      this.preKey.publicKey
    )
  }

  // Generate a new key bundle pair with the preKey signed byt the identityKey.
  static async generate(wallet?: ethers.Signer): Promise<PrivateKeyBundle> {
    const identityKey = PrivateKey.generate()
    const preKey = PrivateKey.generate()
    await identityKey.signKey(preKey.publicKey)
    if (wallet) {
      identityKey.publicKey.signWithWallet(wallet)
    }
    return new PrivateKeyBundle(identityKey, preKey)
  }

  // sharedSecret derives a secret from peer's key bundles using a variation of X3DH protocol
  // where the sender's ephemeral key pair is replaced by the sender's prekey.
  // @recipient indicates whether this is the sending (encrypting) or receiving (decrypting) side.
  async sharedSecret(
    peer: PublicKeyBundle,
    recipient: boolean
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
    let dh1: Uint8Array, dh2: Uint8Array
    if (recipient) {
      dh1 = this.preKey.sharedSecret(peer.identityKey)
      dh2 = this.identityKey.sharedSecret(peer.preKey)
    } else {
      dh1 = this.identityKey.sharedSecret(peer.preKey)
      dh2 = this.preKey.sharedSecret(peer.identityKey)
    }
    const dh3 = this.preKey.sharedSecret(peer.preKey)
    const secret = new Uint8Array(dh1.length + dh2.length + dh3.length)
    secret.set(dh1, 0)
    secret.set(dh2, dh1.length)
    secret.set(dh3, dh1.length + dh2.length)
    return secret
  }

  async encode(wallet: ethers.Signer): Promise<Uint8Array> {
    // serialize the contents
    if (this.preKeys.length === 0) {
      throw new Error('missing pre key')
    }
    if (!this.identityKey) {
      throw new Error('missing identity key')
    }
    const bytes = proto.PrivateKeyBundle.encode({
      identityKey: this.identityKey,
      preKeys: [this.preKey],
    }).finish()
    const wPreKey = getRandomValues(new Uint8Array(32))
    const secret = hexToBytes(await wallet.signMessage(wPreKey))
    const ciphertext = await encrypt(bytes, secret)
    return proto.EncryptedPrivateKeyBundle.encode({
      walletPreKey: wPreKey,
      ciphertext,
    }).finish()
  }

  static async decode(
    wallet: ethers.Signer,
    bytes: Uint8Array
  ): Promise<PrivateKeyBundle> {
    const encrypted = proto.EncryptedPrivateKeyBundle.decode(bytes)
    if (!encrypted.walletPreKey) {
      throw new Error('missing wallet pre-key')
    }
    const secret = hexToBytes(await wallet.signMessage(encrypted.walletPreKey))
    if (!encrypted.ciphertext?.aes256GcmHkdfSha256) {
      throw new Error('missing bundle ciphertext')
    }
    const ciphertext = new Ciphertext(encrypted.ciphertext)
    const decrypted = await decrypt(ciphertext, secret)
    const bundle = proto.PrivateKeyBundle.decode(decrypted)
    if (!bundle.identityKey) {
      throw new Error('missing identity key')
    }
    if (bundle.preKeys.length === 0) {
      throw new Error('missing pre-keys')
    }
    return new PrivateKeyBundle(
      new PrivateKey(bundle.identityKey),
      new PrivateKey(bundle.preKeys[0])
    )
  }
}
