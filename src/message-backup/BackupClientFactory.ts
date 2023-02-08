import { PrivateKey } from '../crypto'
import BackupClient, {
  BackupConfiguration,
  BackupProvider,
  SelectBackupProvider,
} from './BackupClient'
import NoBackupClient from './NoBackupClient'
import XMTPBackupClient from './XMTPBackupClient'

/**
 * Creates a backup client of the correct provider type (e.g. xmtp backup, no backup, etc).
 * Uses an existing user preference from the backend if it exists, else prompts for a new
 * one using the `providerSelector`
 *
 * @param identityKey
 * @param providerSelector A method for getting the provider to use, in the event there is no
 * existing user preference. The app can define the policy to use here (e.g. prompt the user,
 * or default to a certain provider type).
 * @returns A backup client of the correct type
 */
export async function createBackupClient(
  identityKey: PrivateKey,
  selectBackupProvider: SelectBackupProvider
): Promise<BackupClient> {
  const configuration = await fetchOrCreateConfiguration(
    identityKey,
    selectBackupProvider
  )
  switch (configuration.provider) {
    case BackupProvider.none:
      return new NoBackupClient(configuration)
    case BackupProvider.xmtp:
      return new XMTPBackupClient(configuration)
  }
}

export async function fetchOrCreateConfiguration(
  identityKey: PrivateKey,
  selectBackupProvider: SelectBackupProvider
): Promise<BackupConfiguration> {
  // TODO: return existing configuration from the backend if it exists
  let backupConfiguration: BackupConfiguration
  const provider = await selectBackupProvider()
  switch (provider) {
    case BackupProvider.none:
      backupConfiguration = NoBackupClient.createConfiguration()
      break
    case BackupProvider.xmtp:
      backupConfiguration = XMTPBackupClient.createConfiguration(identityKey)
      break
  }
  // TODO: Persist new configuration to backend
  return backupConfiguration
}
