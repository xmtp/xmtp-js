import { PrivateKey } from '../crypto'
import BackupClient, {
  BackupConfiguration,
  BackupProvider,
} from './BackupClient'

const PROVIDER = BackupProvider.xmtp
export default class XMTPBackupClient implements BackupClient {
  private configuration: BackupConfiguration

  public static createConfiguration(
    walletAddress: string
  ): BackupConfiguration {
    // TODO: randomly generate topic and encryption key
    return {
      provider: PROVIDER,
      location: 'dummy-history:' + walletAddress,
    }
  }

  constructor(configuration: BackupConfiguration) {
    if (configuration.provider !== PROVIDER) {
      throw new Error('Using incorrect backup client for provider')
    }
    this.configuration = configuration
  }

  public get provider(): BackupProvider {
    return PROVIDER
  }
}
