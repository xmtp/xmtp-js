import { PrivateKey } from '../crypto'
import NoBackupClient from './NoBackupClient'
import XMTPBackupClient from './XMTPBackupClient'

export enum BackupProvider {
  none,
  xmtp,
}

export interface BackupConfiguration {
  provider: BackupProvider
  // For the XMTP BackupProvider, this is the name of a topic
  location?: string
  // For the XMTP BackupProvider, this is the symmetric encryption key used to encrypt/decrypt backups
  encryptionKey?: string
}

/**
 * BackupClient class manages message backups according to a user-specified configuration.
 * Should be created with `await BackupClient.create(existingConfiguration)`
 */
export default abstract class BackupClient {
  protected configuration: BackupConfiguration

  constructor(configuration: BackupConfiguration) {
    if (configuration.provider !== this.getProvider()) {
      throw new Error('Using incorrect backup client for provider')
    }
    this.configuration = configuration
  }

  public abstract getProvider(): BackupProvider

  public static async fetchConfiguration(
    identityKey: PrivateKey
  ): Promise<BackupConfiguration | null> {
    // TODO: fetch configuration from the backend
    return Promise.resolve(null)
  }

  // If there is no existing configuration, a new configuration can be created
  // by setting a backup provider of the user's preference
  public static async setupConfiguration(
    identityKey: PrivateKey,
    provider: BackupProvider
  ): Promise<BackupConfiguration> {
    // TODO:
    // Validate there is no existing backup provider
    // Generate location and encryption key
    // Upload new pref
    throw new Error('Not implemented')
  }

  public static create(
    existingConfiguration: BackupConfiguration
  ): BackupClient {
    switch (existingConfiguration.provider) {
      case BackupProvider.none:
        return new NoBackupClient(existingConfiguration)
      case BackupProvider.xmtp:
        return new XMTPBackupClient(existingConfiguration)
    }
  }
}
