import * as assert from 'assert'
import { ContactBundleV1, DecodeContactBundle } from '../src/ContactBundle'
import { PrivateKeyBundleV1, PublicKeyBundle } from '../src'

describe('ContactBundles', function () {
  it('roundtrip', async function () {
    const priv = await PrivateKeyBundleV1.generate()
    const pub = priv.getPublicKeyBundle()
    let bytes = pub.toBytes()
    const cb = DecodeContactBundle(bytes)
    expect(cb.keyBundle).toBeInstanceOf(PublicKeyBundle)
    assert.ok(pub.equals(cb.keyBundle as PublicKeyBundle))

    const cb1 = new ContactBundleV1({ keyBundle: priv.getPublicKeyBundle() })
    bytes = cb1.toBytes()
    const cb2 = DecodeContactBundle(bytes)
    expect(cb2.keyBundle).toBeInstanceOf(PublicKeyBundle)
    assert.ok(pub.equals(cb2.keyBundle as PublicKeyBundle))

    const bytes2 = cb2.toBytes()
    assert.deepEqual(bytes, bytes2)
  })
})
