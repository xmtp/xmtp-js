import PrivateKey from './crypto/PrivateKey'
import PrivateKeyBundle from './crypto/PrivateKeyBundle'
import PublicKeyBundle from './crypto/PublicKeyBundle'

enum EncryptionAlgorithm {
  AES_256_GCM_HKDF_SHA_256,
}

type TopicKeyRecord = {
  keyMaterial: Uint8Array
  encryptionAlgorithm: EncryptionAlgorithm
  allowedSigners: PublicKeyBundle[]
}

type TopicResult = {
  // This would never include the client. We can assume you are in every topic available
  topicKey: TopicKeyRecord
  contentTopic: string
}

type WalletTopicRecord = {
  contentTopic: string
  createdAt: Date
}

type ContentTopic = string
type WalletAddress = string

export default class KeyManager {
  privateKeyBundle: PrivateKeyBundle
  private topicKeys: Map<ContentTopic, TopicKeyRecord>
  private dmTopics: Map<WalletAddress, WalletTopicRecord[]>

  constructor(bundle: PrivateKeyBundle) {
    this.topicKeys = new Map<ContentTopic, TopicKeyRecord>()
    this.dmTopics = new Map<WalletAddress, WalletTopicRecord[]>()
    this.privateKeyBundle = bundle
  }

  addDirectMessageTopic(
    contentTopic: string,
    key: TopicKeyRecord,
    counterparty: PublicKeyBundle,
    createdAt: Date
  ): void {
    if (this.topicKeys.has(contentTopic)) {
      throw new Error('Topic key has already been set')
    }
    this.topicKeys.set(contentTopic, key)

    const walletAddress = counterparty.identityKey.walletSignatureAddress()
    const counterpartyTopicList = this.dmTopics.get(walletAddress) || []
    counterpartyTopicList.push({ contentTopic, createdAt })
    this.dmTopics.set(walletAddress, counterpartyTopicList)
  }

  // Would be used to get all information required to decrypt/validate a given message
  getTopicResult(contentTopic: string): TopicResult | undefined {
    const topicKey = this.topicKeys.get(contentTopic)
    if (!topicKey) {
      return undefined
    }
    return {
      topicKey,
      contentTopic,
    }
  }

  // Would be used to know which topic/key to use to send to a given wallet address
  getLatestDirectMessageTopic(walletAddress: string): TopicResult | undefined {
    const walletTopics = this.dmTopics.get(walletAddress)
    if (!walletTopics || !walletTopics.length) {
      return undefined
    }
    const newestTopic = this.findLatestTopic(walletTopics)
    return this.getTopicResult(newestTopic.contentTopic)
  }

  // Would be used to get the topic list to listen for all messages from a given wallet address
  getAllDirectMessageTopics(walletAddress: string): TopicResult[] {
    const dmTopics = this.dmTopics
      .get(walletAddress)
      ?.map(({ contentTopic }) => this.getTopicResult(contentTopic))
      .filter((res) => !!res) as TopicResult[]

    return dmTopics || []
  }

  private findLatestTopic(records: WalletTopicRecord[]): WalletTopicRecord {
    let latestRecord: WalletTopicRecord | undefined
    for (const record of records) {
      if (!latestRecord || record.createdAt > latestRecord.createdAt) {
        latestRecord = record
      }
    }
    if (!latestRecord) {
      throw new Error('No record found')
    }
    return latestRecord
  }
}
