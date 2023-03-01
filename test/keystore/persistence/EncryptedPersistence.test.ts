import { PrivateKeyBundleV1 } from './../../../src/crypto/PrivateKeyBundle'
import {
  EncryptedPersistence,
  LocalStoragePersistence,
} from '../../../src/keystore/persistence'
import { getRandomValues } from '../../../src/crypto/utils'

const TEST_KEY = 'test-key'
const TEST_KEY_2 = 'test-key-2'

describe('EncryptedPersistence', () => {
  let privateKey: Uint8Array

  beforeEach(async () => {
    const bundle = await PrivateKeyBundleV1.generate()
    privateKey = bundle.getCurrentPreKey().secp256k1.bytes
  })

  it('can encrypt and decrypt a value', async () => {
    const data = getRandomValues(new Uint8Array(128))
    const persistence = new LocalStoragePersistence()
    const encryptedPersistence = new EncryptedPersistence(
      persistence,
      privateKey
    )

    await encryptedPersistence.setItem(TEST_KEY, data)
    const result = await encryptedPersistence.getItem(TEST_KEY)
    expect(result).toEqual(data)

    const rawResult = await persistence.getItem(TEST_KEY)
    expect(rawResult).not.toEqual(data)
  })

  it('works with arbitrarily sized inputs', async () => {
    const inputs = [
      getRandomValues(new Uint8Array(32)),
      getRandomValues(new Uint8Array(128)),
      getRandomValues(new Uint8Array(1024)),
    ]
    for (const input of inputs) {
      const encryptedPersistence = new EncryptedPersistence(
        new LocalStoragePersistence(),
        privateKey
      )

      await encryptedPersistence.setItem(TEST_KEY, input)
      const returnedResult = await encryptedPersistence.getItem(TEST_KEY)
      expect(returnedResult).toEqual(input)
    }
  })

  it('uses random values to encrypt repeatedly', async () => {
    const data = getRandomValues(new Uint8Array(128))
    const persistence = new LocalStoragePersistence()
    const encryptedPersistence = new EncryptedPersistence(
      persistence,
      privateKey
    )

    await encryptedPersistence.setItem(TEST_KEY, data)
    await encryptedPersistence.setItem(TEST_KEY_2, data)

    const [rawResult1, rawResult2] = await Promise.all([
      persistence.getItem(TEST_KEY),
      persistence.getItem(TEST_KEY_2),
    ])
    expect(rawResult1).not.toEqual(rawResult2)
  })
})
