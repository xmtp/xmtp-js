import { Persistence } from './interface'
import eccrypto, { Ecies } from 'eccrypto'

const assertEciesLengths = (ecies: Ecies): void => {
  if (ecies.iv.length !== 16) {
    throw new Error('Invalid iv length')
  }
  if (ecies.ephemPublicKey.length !== 65) {
    throw new Error('Invalid ephemPublicKey length')
  }
  if (ecies.ciphertext.length < 1) {
    throw new Error('Invalid ciphertext length')
  }
  if (ecies.mac.length !== 32) {
    throw new Error('Invalid mac length')
  }
}

const serializeEcies = (ecies: Ecies): Uint8Array => {
  assertEciesLengths(ecies)
  const { iv, ephemPublicKey, ciphertext, mac } = ecies
  const result = new Uint8Array(
    iv.length + ephemPublicKey.length + ciphertext.length + mac.length
  )
  result.set(iv, 0)
  result.set(ephemPublicKey, iv.length)
  result.set(ciphertext, iv.length + ephemPublicKey.length)
  result.set(mac, iv.length + ephemPublicKey.length + ciphertext.length)
  return result
}

const deserializeEcies = (data: Uint8Array): Ecies => {
  const iv = data.slice(0, 16)
  const ephemPublicKey = data.slice(16, 81)
  const ciphertext = data.slice(81, data.length - 32)
  const mac = data.slice(data.length - 32, data.length)
  return {
    iv: Buffer.from(iv),
    ephemPublicKey: Buffer.from(ephemPublicKey),
    ciphertext: Buffer.from(ciphertext),
    mac: Buffer.from(mac),
  }
}

/**
 * EncryptedPersistence is a Persistence implementation that uses ECIES to encrypt all values
 */
export default class EncryptedPersistence implements Persistence {
  private persistence: Persistence
  private privateKey: Buffer
  private publicKey: Buffer

  constructor(persistence: Persistence, privateKey: Uint8Array) {
    this.persistence = persistence
    this.privateKey = Buffer.from(privateKey)
    this.publicKey = eccrypto.getPublic(Buffer.from(privateKey))
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
    const ecies = await eccrypto.encrypt(this.publicKey, Buffer.from(value))
    return serializeEcies(ecies)
  }

  private async decrypt(value: Uint8Array): Promise<Uint8Array> {
    const ecies = deserializeEcies(value)
    const result = await eccrypto.decrypt(this.privateKey, ecies)
    return Uint8Array.from(result)
  }
}
