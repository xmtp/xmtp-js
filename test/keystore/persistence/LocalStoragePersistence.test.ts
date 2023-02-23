import LocalStoragePersistence from '../../../src/keystore/persistence/LocalStoragePersistence'
import { PrivateKeyBundleV1 } from '../../../src/crypto'
import { privateKey } from '@xmtp/proto'

describe('Persistence', () => {
  describe('LocalStoragePersistence', () => {
    let persistence: LocalStoragePersistence
    const key = 'test'
    beforeEach(async () => {
      persistence = new LocalStoragePersistence()
    })

    it('can store and retrieve proto objects', async () => {
      const pk = await PrivateKeyBundleV1.generate()
      await persistence.setItem(key, pk.encode())
      const retrieved = await persistence.getItem(key)
      expect(retrieved).toBeTruthy()

      const decoded = new PrivateKeyBundleV1(
        privateKey.PrivateKeyBundleV1.decode(retrieved as Uint8Array)
      )
      expect(
        decoded.identityKey.publicKey.equals(pk.identityKey.publicKey)
      ).toBeTruthy()

      expect(pk).toEqual(decoded)
    })

    it('returns null when no object found', async () => {
      const result = await persistence.getItem('wrong key')
      expect(result).toBeNull()
    })

    it('throws when invalid key is used', async () => {
      expect(persistence.getItem([1, 2, 3] as any)).rejects.toThrow()
    })
  })
})
