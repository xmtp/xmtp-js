import BackupClient, {
  BackupConfiguration,
  BackupProvider,
} from './BackupClient'

const PROVIDER = BackupProvider.none
export default class NoBackupClient implements BackupClient {
  private configuration: BackupConfiguration

  public static createConfiguration(): BackupConfiguration {
    return {
      provider: PROVIDER,
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
