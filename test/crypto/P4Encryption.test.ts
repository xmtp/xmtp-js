import { PrivateKeyBundleV1 } from '../../src/crypto/PrivateKeyBundle'
import SelfEncryption from '../../src/crypto/SelfEncryption'
import { newWallet } from '../helpers'
import { equalBytes } from '../../src/crypto/utils'

describe('SelfEncryption', () => {
  let bundle: PrivateKeyBundleV1

  beforeEach(async () => {
    bundle = await PrivateKeyBundleV1.generate(newWallet())
  })

  it('round trips data', async () => {
    const message = new TextEncoder().encode('hello world')
    const encryptor = new SelfEncryption(bundle.identityKey)

    const ciphertext = encryptor.encrypt(message)
    expect(ciphertext).toBeDefined()

    const decrypted = encryptor.decrypt(ciphertext)
    expect(equalBytes(decrypted, message)).toBeTruthy()
  })

  it('throws on decryption failure', async () => {
    const message = new TextEncoder().encode('hello world')
    const encryptor = new SelfEncryption(bundle.identityKey)

    const ciphertext = encryptor.encrypt(message)
    expect(ciphertext).toBeDefined()

    const differentEncryptor = new SelfEncryption(
      (await PrivateKeyBundleV1.generate(newWallet())).identityKey
    )
    expect(() => differentEncryptor.decrypt(ciphertext)).toThrow()
  })
})
