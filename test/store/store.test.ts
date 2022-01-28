import { LocalStorageStore } from '../../src/store'
import assert from 'assert'
import { WakuMessage } from 'js-waku'

describe('LocalStorageStore', () => {
  const store = new LocalStorageStore()
  beforeEach(() => {
    localStorage.clear()
  })

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
