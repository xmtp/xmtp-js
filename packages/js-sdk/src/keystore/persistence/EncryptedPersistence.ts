import { decrypt, encrypt, getPublic, type Ecies } from '@/crypto/ecies'
import type { PrivateKey, SignedPrivateKey } from '@/crypto/PrivateKey'
import SignedEciesCiphertext from '@/crypto/SignedEciesCiphertext'
import type { Persistence } from './interface'

/**
 * EncryptedPersistence is a Persistence implementation that uses ECIES to encrypt all values
 * ECIES encryption protects against unauthorized reads, but not unauthorized writes.
 * A third party with access to the underlying store could write malicious data using the public key of the owner
 */
export default class EncryptedPersistence implements Persistence {
  private persistence: Persistence
  private privateKey: PrivateKey | SignedPrivateKey
  private privateKeyBytes: Buffer
  private publicKey: Buffer

  constructor(
    persistence: Persistence,
    privateKey: PrivateKey | SignedPrivateKey
  ) {
    this.persistence = persistence
    this.privateKey = privateKey
    this.privateKeyBytes = Buffer.from(privateKey.secp256k1.bytes)
    this.publicKey = getPublic(this.privateKeyBytes)
  }

  async getItem(key: string): Promise<Uint8Array | null> {
    const encrypted = await this.persistence.getItem(key)
    if (encrypted) {
      return this.decrypt(encrypted)
    }
    return null
  }

  async setItem(key: string, value: Uint8Array): Promise<void> {
    const encrypted = await this.encrypt(value)
    await this.persistence.setItem(key, encrypted)
  }

  private async encrypt(value: Uint8Array): Promise<Uint8Array> {
    const ecies = await encrypt(this.publicKey, Buffer.from(value))
    return this.serializeEcies(ecies)
  }

  private async decrypt(value: Uint8Array): Promise<Uint8Array> {
    const ecies = await this.deserializeEcies(value)
    const result = await decrypt(this.privateKeyBytes, ecies)
    return Uint8Array.from(result)
  }

  private async serializeEcies(data: Ecies): Promise<Uint8Array> {
    // This will create and sign a `SignedEciesCiphertext` payload based on the provided data
    const protoVal = await SignedEciesCiphertext.create(data, this.privateKey)
    return protoVal.toBytes()
  }

  private async deserializeEcies(data: Uint8Array): Promise<Ecies> {
    const protoVal = SignedEciesCiphertext.fromBytes(data)
    // Verify the signature upon deserializing
    if (!(await protoVal.verify(this.privateKey.publicKey))) {
      throw new Error('signature validation failed')
    }
    const ecies = protoVal.ciphertext

    return {
      ciphertext: Buffer.from(ecies.ciphertext),
      mac: Buffer.from(ecies.mac),
      iv: Buffer.from(ecies.iv),
      ephemeralPublicKey: Buffer.from(ecies.ephemeralPublicKey),
    }
  }
}
