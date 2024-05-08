import type BackupClient from './BackupClient'
import {
  BackupType,
  type BackupConfiguration,
  type SelectBackupProvider,
} from './BackupClient'
import NoBackupClient from './NoBackupClient'
import TopicStoreBackupClient from './TopicStoreBackupClient'

/**
 * Creates a backup client of the correct provider type (e.g. xmtp backup, no backup, etc).
 * Uses an existing user preference from the backend if it exists, else prompts for a new
 * one using the `providerSelector`
 * @param walletAddress The public address of the user's wallet
 * @param selectBackupProvider A callback for determining the provider to use, in the event there is no
 * existing user preference. The app can define the policy to use here (e.g. prompt the user,
 * or default to a certain provider type).
 * @returns {Promise<BackupClient>} A backup client of the correct type
 */
export async function createBackupClient(
  walletAddress: string,
  selectBackupProvider: SelectBackupProvider
): Promise<BackupClient> {
  const configuration = await fetchOrCreateConfiguration(
    walletAddress,
    selectBackupProvider
  )
  switch (configuration.type) {
    case BackupType.none:
      return new NoBackupClient(configuration)
    case BackupType.xmtpTopicStore:
      return new TopicStoreBackupClient(configuration)
  }
}

export async function fetchOrCreateConfiguration(
  walletAddress: string,
  selectBackupProvider: SelectBackupProvider
): Promise<BackupConfiguration> {
  // TODO: return existing configuration from the backend if it exists
  let backupConfiguration: BackupConfiguration
  const provider = await selectBackupProvider()
  switch (provider.type) {
    case BackupType.none:
      backupConfiguration = NoBackupClient.createConfiguration()
      break
    case BackupType.xmtpTopicStore:
      backupConfiguration =
        TopicStoreBackupClient.createConfiguration(walletAddress)
      break
  }
  // TODO: Persist new configuration to backend
  return backupConfiguration
}
