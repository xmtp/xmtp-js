import * as assert from 'assert'
import { decodeContactBundle, encodeContactBundle } from '../src/ContactBundle'
import { PublicKeyBundle, SignedPublicKeyBundle } from '../src'
import {
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from '../src/crypto/PrivateKeyBundle'

import { newWallet } from './helpers'

describe('ContactBundles', function () {
  it('roundtrip', async function () {
    const priv = await PrivateKeyBundleV1.generate()
    const pub = priv.getPublicKeyBundle()
    let bytes = encodeContactBundle(pub)
    const cb = decodeContactBundle(bytes)
    expect(cb).toBeInstanceOf(PublicKeyBundle)
    assert.ok(pub.equals(cb as PublicKeyBundle))
  })
  it('roundtrip v2', async function () {
    const wallet = newWallet()
    const priv = await PrivateKeyBundleV2.generate(wallet)
    const pub = priv.getPublicKeyBundle()
    let bytes = encodeContactBundle(pub)
    const cb = decodeContactBundle(bytes)
    expect(cb).toBeInstanceOf(SignedPublicKeyBundle)
    assert.ok(pub.equals(cb as SignedPublicKeyBundle))
  })
})
