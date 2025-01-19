/// <reference lib="dom" />
/// <reference lib="es2017" />

/* global crypto */
import type BackupClient from "./BackupClient";
import { BackupType, type TopicStoreBackupConfiguration } from "./BackupClient";

const BACKUP_TYPE = BackupType.xmtpTopicStore;
export default class TopicStoreBackupClient implements BackupClient {
  private configuration: TopicStoreBackupConfiguration;

  public static createConfiguration(
    walletAddress: string,
  ): TopicStoreBackupConfiguration {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    
    const timestamp = new Date().getTime();
    const randomId = Array.from(randomBytes.slice(0, 4))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');
    const randomTopic = `history-v0:${walletAddress}:${timestamp}:${randomId}`;
    
    return {
      type: BACKUP_TYPE,
      version: 0,
      topic: randomTopic,
      secret: randomBytes,
    };
  }

  constructor(configuration: TopicStoreBackupConfiguration) {
    this.configuration = configuration;
  }

  public get backupType(): BackupType {
    return BACKUP_TYPE;
  }
}
