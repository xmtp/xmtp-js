/**
 * Where message backups should be stored
 */
export enum BackupType {
  none,
  xmtpTopicStore,
}
export interface BackupProvider {
  type: BackupType
}
export type SelectBackupProvider = () => Promise<BackupProvider>

export interface NoBackupConfiguration {
  type: BackupType.none
  version: number
}
export interface TopicStoreBackupConfiguration {
  type: BackupType.xmtpTopicStore
  version: number
  // The location where the backup will be stored
  topic: string
  // The symmetric encryption key used to encrypt/decrypt backups (optional for now)
  secret?: Uint8Array
}
export type BackupConfiguration =
  | NoBackupConfiguration
  | TopicStoreBackupConfiguration

export default interface BackupClient {
  get backupType(): BackupType
}
