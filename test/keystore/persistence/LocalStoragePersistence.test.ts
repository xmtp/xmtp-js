import LocalStoragePersistence from '../../../src/keystore/persistence/LocalStoragePersistence'
import { decodePrivateKeyBundle, PrivateKeyBundleV1 } from '../../../src/crypto'

describe('Persistence', () => {
  describe('LocalStoragePersistence', () => {
    let persistence: LocalStoragePersistence
    const key = 'test'
    beforeEach(async () => {
      persistence = new LocalStoragePersistence()
    })

    it('can store and retrieve proto objects', async () => {
      const pk = await PrivateKeyBundleV1.generate()
      const encodedPk = Uint8Array.from(pk.encode())
      await persistence.setItem(key, encodedPk)
      const retrieved = await persistence.getItem(key)
      expect(retrieved).toBeTruthy()
      const decoded = decodePrivateKeyBundle(retrieved as Uint8Array)
      if (!(decoded instanceof PrivateKeyBundleV1)) {
        throw new Error('Decoded key is not a PrivateKeyBundleV1')
      }
      expect(
        decoded.identityKey.publicKey.equals(pk.identityKey.publicKey)
      ).toBeTruthy()
    })

    it('returns null when no object found', async () => {
      const result = await persistence.getItem('wrong key')
      expect(result).toBeNull()
    })
  })
})
