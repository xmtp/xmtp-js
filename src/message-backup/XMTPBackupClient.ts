import BackupClient, { BackupProvider } from './BackupClient'

export default class XMTPBackupClient extends BackupClient {
  getProvider(): BackupProvider {
    return BackupProvider.xmtp
  }
}
