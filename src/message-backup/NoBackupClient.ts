import BackupClient, {
  BackupConfiguration,
  BackupProvider,
} from './BackupClient'

export default class NoBackupClient extends BackupClient {
  public static createConfiguration(): BackupConfiguration {
    return {
      provider: BackupProvider.none,
    }
  }

  public getProvider(): BackupProvider {
    return BackupProvider.none
  }
}
