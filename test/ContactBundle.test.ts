import * as assert from 'assert'
import {
  ContactBundleV1,
  ContactBundleV2,
  decodeContactBundle,
} from '../src/ContactBundle'
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
    expect(cb.keyBundle).toBeInstanceOf(PublicKeyBundle)
    assert.ok(pub.equals(cb.keyBundle as PublicKeyBundle))

    const cb1 = new ContactBundleV1({ keyBundle: priv.getPublicKeyBundle() })
    bytes = cb1.toBytes()
    const cb2 = decodeContactBundle(bytes)
    expect(cb2.keyBundle).toBeInstanceOf(PublicKeyBundle)
    assert.ok(pub.equals(cb2.keyBundle as PublicKeyBundle))

    const bytes2 = cb2.toBytes()
    assert.deepEqual(bytes, bytes2)
  })
  it('roundtrip v2', async function () {
    const wallet = newWallet()
    const priv = await PrivateKeyBundleV2.generate(wallet)
    const pub = priv.getPublicKeyBundle()
    const cb1 = new ContactBundleV2({ keyBundle: priv.getPublicKeyBundle() })
    let bytes = cb1.toBytes()
    const cb2 = decodeContactBundle(bytes)
    expect(cb2.keyBundle).toBeInstanceOf(SignedPublicKeyBundle)
    assert.ok(pub.equals(cb2.keyBundle as SignedPublicKeyBundle))

    const bytes2 = cb2.toBytes()
    assert.deepEqual(bytes, bytes2)
  })
})
