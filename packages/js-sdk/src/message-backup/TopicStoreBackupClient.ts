import type BackupClient from './BackupClient'
import { BackupType, type TopicStoreBackupConfiguration } from './BackupClient'

const BACKUP_TYPE = BackupType.xmtpTopicStore
export default class TopicStoreBackupClient implements BackupClient {
  private configuration: TopicStoreBackupConfiguration

  public static createConfiguration(
    walletAddress: string
  ): TopicStoreBackupConfiguration {
    // TODO: randomly generate topic and encryption key
    return {
      type: BACKUP_TYPE,
      version: 0,
      topic: 'history-v0:' + walletAddress,
    }
  }

  constructor(configuration: TopicStoreBackupConfiguration) {
    this.configuration = configuration
  }

  public get backupType(): BackupType {
    return BACKUP_TYPE
  }
}
