import InMemoryPersistence from "@/keystore/persistence/InMemoryPersistence";
import type { KeystoreProviderOptions } from "@/keystore/providers/interfaces";

export const testProviderOptions = ({
  privateKeyOverride = undefined,
  persistConversations = false,
  basePersistence = InMemoryPersistence.create(),
  env = "local" as const,
}: Partial<KeystoreProviderOptions>) => ({
  env,
  persistConversations,
  privateKeyOverride,
  basePersistence,
  disablePersistenceEncryption: false,
});
