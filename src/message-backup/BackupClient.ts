/**
 * Where message backups should be stored
 */
export enum BackupProvider {
  none,
  xmtp,
}
export type SelectBackupProvider = () => Promise<BackupProvider>

export interface BackupConfiguration {
  provider: BackupProvider
  // For the XMTP BackupProvider, this is the name of a topic
  location?: string
  // For the XMTP BackupProvider, this is the symmetric encryption key used to encrypt/decrypt backups
  secret?: Uint8Array
}

export default interface BackupClient {
  get provider(): BackupProvider
}
