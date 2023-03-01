import {
  LocalStoragePersistence,
  PrefixedPersistence,
} from '../../../src/keystore/persistence'

describe('PrefixedPersistence', () => {
  it('correctly adds a prefix to keys', async () => {
    const persistence = new LocalStoragePersistence()
    const prefixedPersistence = new PrefixedPersistence('foo', persistence)
    await prefixedPersistence.setItem('bar', new Uint8Array([1, 2, 3]))

    const resultFromPrefixed = await prefixedPersistence.getItem('bar')
    expect(resultFromPrefixed).toEqual(new Uint8Array([1, 2, 3]))

    const resultFromRaw = await persistence.getItem('foobar')
    expect(resultFromRaw).toEqual(new Uint8Array([1, 2, 3]))
  })
})
