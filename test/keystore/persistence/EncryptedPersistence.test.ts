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
    privateKey = bundle.identityKey.secp256k1.bytes
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

  it('catches garbage values', async () => {
    const data = getRandomValues(new Uint8Array(128))
    const persistence = new LocalStoragePersistence()
    const encryptedPersistence = new EncryptedPersistence(
      persistence,
      privateKey
    )

    // Set an unencrypted value of 'garbage' as bytes
    await persistence.setItem(
      TEST_KEY,
      new Uint8Array([103, 97, 114, 98, 97, 103, 101])
    )
    // Expect an error if the ciphertext is tampered with
    await expect(encryptedPersistence.getItem(TEST_KEY)).rejects.toThrow(
      'Invalid data length'
    )
  })

  it('detects bad mac', async () => {
    const data = getRandomValues(new Uint8Array(128))
    const persistence = new LocalStoragePersistence()
    const encryptedPersistence = new EncryptedPersistence(
      persistence,
      privateKey
    )

    // Write the value with encryption
    await encryptedPersistence.setItem(TEST_KEY, data)

    // Read the raw result, change one byte, write it back
    const rawResult = await persistence.getItem(TEST_KEY)!
    rawResult![7] += 1
    await persistence.setItem(TEST_KEY, rawResult!)

    // Expect an error if the ciphertext is tampered with
    await expect(encryptedPersistence.getItem(TEST_KEY)).rejects.toThrow(
      'Bad MAC'
    )
  })

  it('detects length modified ciphertext', async () => {
    const data = getRandomValues(new Uint8Array(128))
    const persistence = new LocalStoragePersistence()
    const encryptedPersistence = new EncryptedPersistence(
      persistence,
      privateKey
    )

    await encryptedPersistence.setItem(TEST_KEY, data)
    // Read the raw result, change one byte, write it back
    const rawResult = await persistence.getItem(TEST_KEY)!
    // Add a byte to the rawResult
    const newRawResult = new Uint8Array(rawResult!.length + 1)
    newRawResult.set(rawResult!)
    await persistence.setItem(TEST_KEY, newRawResult)

    // Expect an error if the ciphertext is tampered with
    await expect(encryptedPersistence.getItem(TEST_KEY)).rejects.toThrow(
      'Invalid data length'
    )
  })
})
