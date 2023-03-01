import { Persistence } from './interface'
import eccrypto, { Ecies } from 'eccrypto'

const IV_LENGTH = 16
const EPHEMERAL_PUBLIC_KEY_LENGTH = 65
const MAC_LENGTH = 32
const AES_BLOCK_SIZE = 16
const MIN_DATA_LENGTH =
  IV_LENGTH + EPHEMERAL_PUBLIC_KEY_LENGTH + MAC_LENGTH + AES_BLOCK_SIZE

const assertEciesLengths = (ecies: Ecies): void => {
  if (ecies.iv.length !== IV_LENGTH) {
    throw new Error('Invalid iv length')
  }
  if (ecies.ephemPublicKey.length !== EPHEMERAL_PUBLIC_KEY_LENGTH) {
    throw new Error('Invalid ephemPublicKey length')
  }
  if (
    ecies.ciphertext.length < 1 ||
    ecies.ciphertext.length % AES_BLOCK_SIZE !== 0
  ) {
    throw new Error('Invalid ciphertext length')
  }
  if (ecies.mac.length !== MAC_LENGTH) {
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
  result.set(ephemPublicKey, IV_LENGTH)
  result.set(ciphertext, IV_LENGTH + EPHEMERAL_PUBLIC_KEY_LENGTH)
  result.set(mac, IV_LENGTH + EPHEMERAL_PUBLIC_KEY_LENGTH + ciphertext.length)
  return result
}

const deserializeEcies = (data: Uint8Array): Ecies => {
  if (
    data.length < MIN_DATA_LENGTH ||
    (data.length - MIN_DATA_LENGTH) % AES_BLOCK_SIZE !== 0
  ) {
    throw new Error('Invalid data length')
  }
  const iv = data.slice(0, IV_LENGTH)
  const ephemPublicKey = data.slice(
    IV_LENGTH,
    IV_LENGTH + EPHEMERAL_PUBLIC_KEY_LENGTH
  )
  const ciphertext = data.slice(
    IV_LENGTH + EPHEMERAL_PUBLIC_KEY_LENGTH,
    data.length - 32
  )
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
    this.publicKey = eccrypto.getPublic(this.privateKey)
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
