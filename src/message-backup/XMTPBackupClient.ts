import { PrivateKey } from '../crypto'
import BackupClient, {
  BackupConfiguration,
  BackupProvider,
} from './BackupClient'

export default class XMTPBackupClient extends BackupClient {
  public static createConfiguration(
    identityKey: PrivateKey
  ): BackupConfiguration {
    // TODO: randomly generate topic and encryption key
    return {
      provider: BackupProvider.xmtp,
      location: 'dummy-hist:' + identityKey.publicKey.getEthereumAddress(),
      encryptionKey: 'dummyEncryptionKey',
    }
  }

  getProvider(): BackupProvider {
    return BackupProvider.xmtp
  }
}
