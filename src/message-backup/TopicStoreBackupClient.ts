import BackupClient, { BackupConfiguration, BackupType } from './BackupClient'

const BACKUP_TYPE = BackupType.xmtpTopicStore
export default class TopicStoreBackupClient implements BackupClient {
  private configuration: BackupConfiguration

  public static createConfiguration(
    walletAddress: string
  ): BackupConfiguration {
    // TODO: randomly generate topic and encryption key
    return {
      provider: {
        type: BACKUP_TYPE,
      },
      location: 'dummy-history:' + walletAddress,
    }
  }

  constructor(configuration: BackupConfiguration) {
    if (configuration.provider.type !== BACKUP_TYPE) {
      throw new Error('Initializing incorrect backup type')
    }
    this.configuration = configuration
  }

  public get backupType(): BackupType {
    return BACKUP_TYPE
  }
}
