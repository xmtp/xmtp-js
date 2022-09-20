import * as assert from 'assert'
import ContactBundle from '../src/ContactBundle'
import { PrivateKeyBundle } from '../src'

describe('ContactBundles', function () {
  it('roundtrip', async function () {
    const priv = await PrivateKeyBundle.generate()

    const cb1 = new ContactBundle(priv.getPublicKeyBundle())
    const bytes1 = cb1.toBytes()

    const cb2 = ContactBundle.fromBytes(bytes1)
    const bytes2 = cb2.toBytes()

    assert.deepEqual(bytes1, bytes2)
  })
})
