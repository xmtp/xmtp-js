import { privateKey as proto } from '@xmtp/proto'
import {
  AccountLinkedPrivateKey,
  PrivateKey,
  SignedPrivateKey,
} from './PrivateKey'
import {
  AccountLinkedRole,
  StaticWalletAccountLinkSigner,
  SIWEWalletAccountLinkSigner,
  WalletSigner,
} from './Signature'
import { PublicKey, SignedPublicKey } from './PublicKey'
import {
  PublicKeyBundle,
  SignedPublicKeyBundle,
  SignedPublicKeyBundleV2,
} from './PublicKeyBundle'
import { Signer } from '../types/Signer'
import { NoMatchingPreKeyError } from './errors'

export class PrivateKeyBundleV3 implements proto.PrivateKeyBundleV3 {
  accountLinkedKey: AccountLinkedPrivateKey
  preKeys: SignedPrivateKey[]
  private _publicKeyBundle: SignedPublicKeyBundleV2 | undefined

  constructor(bundle: proto.PrivateKeyBundleV3) {
    if (!bundle.accountLinkedKey) {
      throw new Error('missing account linked key')
    }
    this.accountLinkedKey = new AccountLinkedPrivateKey(bundle.accountLinkedKey)
    this.preKeys = (bundle.preKeys || []).map((k) => new SignedPrivateKey(k))
  }

  // Generate a new key bundle with the preKey signed by the accountLinkedKey.
  // Sign the accountLinkedKey with the provided wallet as well.
  static async generate(
    wallet: Signer,
    role: AccountLinkedRole
  ): Promise<PrivateKeyBundleV3> {
    const accountLinkedKey = await AccountLinkedPrivateKey.generate(
      new StaticWalletAccountLinkSigner(wallet),
      role
    )
    const bundle = new PrivateKeyBundleV3({
      accountLinkedKey,
      preKeys: [],
    })
    await bundle.addPreKey()
    return bundle
  }

  // Generate a new key bundle with the preKey signed by the accountLinkedKey.
  // Sign the accountLinkedKey with the provided wallet as well. Same as above
  // but uses SIWE format signature text. NOTE: in practice, consumers should
  // only use this method if they're okay with using a default SIWE rather than
  // reusing their app-specific login SIWE.
  static async generateSIWE(
    wallet: Signer,
    role: AccountLinkedRole
  ): Promise<PrivateKeyBundleV3> {
    const accountLinkedKey = await AccountLinkedPrivateKey.generate(
      new SIWEWalletAccountLinkSigner(wallet),
      role
    )
    const bundle = new PrivateKeyBundleV3({
      accountLinkedKey,
      preKeys: [],
    })
    await bundle.addPreKey()
    return bundle
  }

  public static fromLegacyBundle(
    bundle: PrivateKeyBundleV2,
    role: AccountLinkedRole
  ): PrivateKeyBundleV3 {
    return new PrivateKeyBundleV3({
      accountLinkedKey: AccountLinkedPrivateKey.fromLegacyKey(
        bundle.identityKey,
        role
      ),
      preKeys: bundle.preKeys,
    })
  }

  public getLinkedAddress(role: AccountLinkedRole): string {
    return this.accountLinkedKey.publicKey.getLinkedAddress(role)
  }

  // Return a key bundle with the current pre-key.
  public getPublicKeyBundle(): SignedPublicKeyBundleV2 {
    if (!this._publicKeyBundle) {
      this._publicKeyBundle = new SignedPublicKeyBundleV2({
        accountLinkedKey: this.accountLinkedKey.publicKey,
        preKey: this.getCurrentPreKey().publicKey,
      })
    }
    return this._publicKeyBundle
  }

  // Generate a new pre-key to be used as the current pre-key.
  private async addPreKey(): Promise<void> {
    this._publicKeyBundle = undefined
    const preKey = await SignedPrivateKey.generate(this.accountLinkedKey)
    this.preKeys.unshift(preKey)
  }

  // Return the current (latest) pre-key (to be advertised).
  public getCurrentPreKey(): SignedPrivateKey {
    return this.preKeys[0]
  }

  // Find pre-key matching the provided public key.
  private findPreKey(which: SignedPublicKey): SignedPrivateKey {
    const preKey = this.preKeys.find((key) => key.matches(which))
    if (!preKey) {
      throw new NoMatchingPreKeyError(which)
    }
    return preKey
  }

  // sharedSecret derives a secret from peer's key bundles using a variation of X3DH protocol
  // where the sender's ephemeral key pair is replaced by the sender's pre-key.
  // @peer is the peer's public key bundle
  // @myPreKey indicates which of my preKeys should be used to derive the secret
  // @recipient indicates if this is the sending or receiving side.
  public async sharedSecret(
    peer: SignedPublicKeyBundleV2,
    myPreKey: SignedPublicKey,
    isRecipient: boolean
  ): Promise<Uint8Array> {
    if (!peer.accountLinkedKey || !peer.preKey) {
      throw new Error('invalid peer key bundle')
    }
    if (!(await peer.accountLinkedKey.verifyKey(peer.preKey))) {
      throw new Error('peer preKey signature invalid')
    }
    if (!this.accountLinkedKey) {
      throw new Error('missing account linked key')
    }
    let dh1: Uint8Array, dh2: Uint8Array, preKey: SignedPrivateKey
    if (isRecipient) {
      if (
        !this.getLinkedAddress(AccountLinkedRole.INBOX_KEY) ||
        !peer.getLinkedAddress(AccountLinkedRole.SEND_KEY)
      ) {
        throw new Error('bundles have invalid roles')
      }
      preKey = this.findPreKey(myPreKey)
      dh1 = preKey.sharedSecret(peer.accountLinkedKey)
      dh2 = this.accountLinkedKey.sharedSecret(peer.preKey)
    } else {
      if (
        !this.getLinkedAddress(AccountLinkedRole.SEND_KEY) ||
        !peer.getLinkedAddress(AccountLinkedRole.INBOX_KEY)
      ) {
        throw new Error('bundles have invalid roles')
      }
      preKey = this.findPreKey(myPreKey)
      dh1 = this.accountLinkedKey.sharedSecret(peer.preKey)
      dh2 = preKey.sharedSecret(peer.accountLinkedKey)
    }
    const dh3 = preKey.sharedSecret(peer.preKey)
    const secret = new Uint8Array(dh1.length + dh2.length + dh3.length)
    secret.set(dh1, 0)
    secret.set(dh2, dh1.length)
    secret.set(dh3, dh1.length + dh2.length)
    return secret
  }
}

// PrivateKeyBundle bundles the private keys corresponding to a PublicKeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.
export class PrivateKeyBundleV2 implements proto.PrivateKeyBundleV2 {
  identityKey: SignedPrivateKey
  preKeys: SignedPrivateKey[]
  version = 2
  private _publicKeyBundle?: SignedPublicKeyBundle

  constructor(bundle: proto.PrivateKeyBundleV2) {
    if (!bundle.identityKey) {
      throw new Error('missing identity key')
    }
    this.identityKey = new SignedPrivateKey(bundle.identityKey)
    this.preKeys = (bundle.preKeys || []).map((k) => new SignedPrivateKey(k))
  }

  // Generate a new key bundle with the preKey signed byt the identityKey.
  // Optionally sign the identityKey with the provided wallet as well.
  static async generate(wallet: Signer): Promise<PrivateKeyBundleV2> {
    const identityKey = await SignedPrivateKey.generate(
      new WalletSigner(wallet)
    )
    const bundle = new PrivateKeyBundleV2({
      identityKey,
      preKeys: [],
    })
    await bundle.addPreKey()
    return bundle
  }

  // Return the current (latest) pre-key (to be advertised).
  getCurrentPreKey(): SignedPrivateKey {
    return this.preKeys[0]
  }

  // Find pre-key matching the provided public key.
  findPreKey(which: SignedPublicKey): SignedPrivateKey {
    const preKey = this.preKeys.find((key) => key.matches(which))
    if (!preKey) {
      throw new NoMatchingPreKeyError(which)
    }
    return preKey
  }

  // Generate a new pre-key to be used as the current pre-key.
  async addPreKey(): Promise<void> {
    this._publicKeyBundle = undefined
    const preKey = await SignedPrivateKey.generate(this.identityKey)
    this.preKeys.unshift(preKey)
  }

  // Return a key bundle with the current pre-key.
  getPublicKeyBundle(): SignedPublicKeyBundle {
    if (!this._publicKeyBundle) {
      this._publicKeyBundle = new SignedPublicKeyBundle({
        identityKey: this.identityKey.publicKey,
        preKey: this.getCurrentPreKey().publicKey,
      })
    }
    return this._publicKeyBundle
  }

  // sharedSecret derives a secret from peer's key bundles using a variation of X3DH protocol
  // where the sender's ephemeral key pair is replaced by the sender's pre-key.
  // @peer is the peer's public key bundle
  // @myPreKey indicates which of my preKeys should be used to derive the secret
  // @recipient indicates if this is the sending or receiving side.
  async sharedSecret(
    peer: SignedPublicKeyBundle,
    myPreKey: SignedPublicKey,
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
    let dh1: Uint8Array, dh2: Uint8Array, preKey: SignedPrivateKey
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

  encode(): Uint8Array {
    return proto.PrivateKeyBundle.encode({
      v1: undefined,
      v2: this,
      v3: undefined,
    }).finish()
  }

  equals(other: this): boolean {
    if (this.preKeys.length !== other.preKeys.length) {
      return false
    }
    for (let i = 0; i < this.preKeys.length; i++) {
      if (!this.preKeys[i].equals(other.preKeys[i])) {
        return false
      }
    }
    return this.identityKey.equals(other.identityKey)
  }

  static fromLegacyBundle(bundle: PrivateKeyBundleV1): PrivateKeyBundleV2 {
    return new PrivateKeyBundleV2({
      identityKey: SignedPrivateKey.fromLegacyKey(bundle.identityKey, true),
      preKeys: bundle.preKeys.map((k: PrivateKey) =>
        SignedPrivateKey.fromLegacyKey(k)
      ),
    })
  }
}

// PrivateKeyBundle bundles the private keys corresponding to a PublicKeyBundle for convenience.
// This bundle must not be shared with anyone, although will have to be persisted
// somehow so that older messages can be decrypted again.
export class PrivateKeyBundleV1 implements proto.PrivateKeyBundleV1 {
  identityKey: PrivateKey
  preKeys: PrivateKey[]
  version = 1
  private _publicKeyBundle?: PublicKeyBundle

  constructor(bundle: proto.PrivateKeyBundleV1) {
    if (!bundle.identityKey) {
      throw new Error('missing identity key')
    }
    this.identityKey = new PrivateKey(bundle.identityKey)
    this.preKeys = (bundle.preKeys || []).map((k) => new PrivateKey(k))
  }

  // Generate a new key bundle with the preKey signed byt the identityKey.
  // Optionally sign the identityKey with the provided wallet as well.
  static async generate(wallet?: Signer): Promise<PrivateKeyBundleV1> {
    const identityKey = PrivateKey.generate()
    if (wallet) {
      await identityKey.publicKey.signWithWallet(wallet)
    }
    const bundle = new PrivateKeyBundleV1({
      identityKey,
      preKeys: [],
    })
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
      throw new NoMatchingPreKeyError(which)
    }
    return preKey
  }

  // Generate a new pre-key to be used as the current pre-key.
  async addPreKey(): Promise<void> {
    this._publicKeyBundle = undefined
    const preKey = PrivateKey.generate()
    await this.identityKey.signKey(preKey.publicKey)
    this.preKeys.unshift(preKey)
  }

  // Return a key bundle with the current pre-key.
  getPublicKeyBundle(): PublicKeyBundle {
    if (!this._publicKeyBundle) {
      this._publicKeyBundle = new PublicKeyBundle({
        identityKey: this.identityKey.publicKey,
        preKey: this.getCurrentPreKey().publicKey,
      })
    }
    return this._publicKeyBundle
  }

  // sharedSecret derives a secret from peer's key bundles using a variation of X3DH protocol
  // where the sender's ephemeral key pair is replaced by the sender's pre-key.
  // @peer is the peer's public key bundle
  // @myPreKey indicates which of my preKeys should be used to derive the secret
  // @recipient indicates if this is the sending or receiving side.
  async sharedSecret(
    peer: PublicKeyBundle | SignedPublicKeyBundle,
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

  encode(): Uint8Array {
    return proto.PrivateKeyBundle.encode({
      v1: this,
      v2: undefined,
      v3: undefined,
    }).finish()
  }
}

export type PrivateKeyBundle = PrivateKeyBundleV1 | PrivateKeyBundleV2

export function decodePrivateKeyBundle(bytes: Uint8Array): PrivateKeyBundle {
  const b = proto.PrivateKeyBundle.decode(bytes)
  if (b.v1) {
    return new PrivateKeyBundleV1(b.v1)
  }
  if (b.v2) {
    return new PrivateKeyBundleV2(b.v2)
  }
  throw new Error('unknown private key bundle version')
}
