import { LocalStoragePersistence } from '../../../src'

export const testProviderOptions = (
  privateKeyOverride = undefined,
  persistConversations = false,
  basePersistence = new LocalStoragePersistence()
) => ({
  env: 'local' as const,
  persistConversations,
  privateKeyOverride,
  basePersistence,
  disablePersistenceEncryption: false,
})
