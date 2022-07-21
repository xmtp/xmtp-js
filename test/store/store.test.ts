// This will create a global localStorage object on Node.js for use in tests
// If we want to save some bytes from the bundle, we can have Webpack replace
// this with an empty module for the browser
import 'node-localstorage/register'
import { EncryptedStore, LocalStorageStore } from '../../src/store'
import assert from 'assert'
import { WakuMessage } from 'js-waku'
import { PrivateKey, PrivateKeyBundle } from '../../src/crypto'
import { Wallet } from 'ethers'

describe('LocalStorageStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const store = new LocalStorageStore()

  it('can get and set valid a valid buffer', async () => {
    const validTestBytes = Buffer.from('gm', 'utf-8')
    await store.set('test-key', validTestBytes)
    assert.equal('gm', await store.get('test-key'))
  })

  it('can get and set message with special characters', async () => {
    const stringWithSpecialChars = '🍕🎉Ѯ'
    const validTestBytes = Buffer.from(stringWithSpecialChars, 'utf-8')
    await store.set('test-key', validTestBytes)
    assert.equal(stringWithSpecialChars, await store.get('test-key'))
  })

  it('returns null for unset values', async () => {
    assert.equal(null, await store.get("key-that-doesn't-exist"))
  })

  it('works with a full waku message', async () => {
    const message = await WakuMessage.fromUtf8String(
      'Test full message',
      '/topic'
    )
    const inputValue = Buffer.from(message.encode())
    await store.set('message', inputValue)
    const storedValue = await store.get('message')

    assert.deepEqual(storedValue, inputValue)

    const newMessage = await WakuMessage.decode(
      Uint8Array.from(storedValue as Buffer)
    )
    assert.equal(newMessage?.payloadAsUtf8, message?.payloadAsUtf8)
  })
})

describe('EncryptedStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const wallet = new Wallet(
    PrivateKey.generate().secp256k1?.bytes as Uint8Array
  )
  const store = new LocalStorageStore()

  it('can encrypt and store a private key bundle', async () => {
    const secureStore = new EncryptedStore(wallet, store)
    const originalBundle = await PrivateKeyBundle.generate(wallet)

    await secureStore.storePrivateKeyBundle(originalBundle)
    const returnedBundle =
      (await secureStore.loadPrivateKeyBundle()) as PrivateKeyBundle

    assert.ok(returnedBundle)
    assert.deepEqual(
      originalBundle.identityKey.toBytes(),
      returnedBundle.identityKey.toBytes()
    )
    assert.equal(originalBundle.preKeys.length, returnedBundle.preKeys.length)
    assert.deepEqual(
      originalBundle.preKeys[0].toBytes(),
      returnedBundle.preKeys[0].toBytes()
    )
  })

  it('returns null when no bundle found', async () => {
    const secureStore = new EncryptedStore(wallet, store)
    assert.equal(null, await secureStore.loadPrivateKeyBundle())
  })
})
