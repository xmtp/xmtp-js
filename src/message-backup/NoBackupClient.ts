import BackupClient, { BackupProvider } from './BackupClient'

export default class NoBackupClient extends BackupClient {
  getProvider(): BackupProvider {
    return BackupProvider.none
  }
}
