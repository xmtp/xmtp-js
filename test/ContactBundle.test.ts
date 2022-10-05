import * as assert from 'assert'
import { decodeContactBundle } from '../src/ContactBundle'
import {
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
  PublicKeyBundle,
  SignedPublicKeyBundle,
  PrivateKey,
} from '../src'
import { newWallet } from './helpers'

describe('ContactBundles', function () {
  it('roundtrip', async function () {
    const priv = await PrivateKeyBundleV1.generate()
    const pub = priv.getPublicKeyBundle()
    let bytes = pub.toBytes()
    const cb = decodeContactBundle(bytes)
    expect(cb).toBeInstanceOf(PublicKeyBundle)
    assert.ok(pub.equals(cb as PublicKeyBundle))

    const bytes2 = cb.toBytes()
    assert.deepEqual(bytes, bytes2)
  })
  it('roundtrip v2', async function () {
    const wallet = newWallet()
    const priv = await PrivateKeyBundleV2.generate(wallet)
    const pub = priv.getPublicKeyBundle()
    let bytes = pub.toBytes()
    const cb = decodeContactBundle(bytes)
    expect(cb).toBeInstanceOf(SignedPublicKeyBundle)
    assert.ok(pub.equals(cb as SignedPublicKeyBundle))

    const bytes2 = cb.toBytes()
    assert.deepEqual(bytes, bytes2)
  })
})
