import BackupClient, { BackupConfiguration, BackupType } from './BackupClient'

const BACKUP_TYPE = BackupType.none
export default class NoBackupClient implements BackupClient {
  private configuration: BackupConfiguration

  public static createConfiguration(): BackupConfiguration {
    return {
      provider: {
        type: BACKUP_TYPE,
      },
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
