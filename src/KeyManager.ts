import PrivateKeyBundle from './crypto/PrivateKeyBundle'
import PublicKeyBundle from './crypto/PublicKeyBundle'

enum EncryptionAlgorithm {
  AES_256_GCM_HKDF_SHA_256,
}

type TopicKeyRecord = {
  keyMaterial: Uint8Array
  encryptionAlgorithm: EncryptionAlgorithm
}

type PrivateKeyRecord = {
  bundle: PrivateKeyBundle
  keySentBy: PublicKeyBundle
}

type TopicResult = {
  // This would never include the client. We can assume you are in every topic available
  participants: PublicKeyBundle[]
  topicKey: TopicKeyRecord
  contentTopic: string
}

type WalletTopicRecord = {
  contentTopic: string
  createdAt: Date
}

export default class KeyManager {
  topicKeys = new Map<string, TopicKeyRecord>()
  topicParticipants = new Map<string, PublicKeyBundle[]>()
  dmTopics = new Map<string, WalletTopicRecord[]>()
  delegateKeys: PrivateKeyRecord[] = []

  addDirectMessageTopic(
    contentTopic: string,
    key: TopicKeyRecord,
    counterparty: PublicKeyBundle,
    createdAt: Date
  ): void {
    if (
      this.topicKeys.has(contentTopic) ||
      this.topicParticipants.has(contentTopic)
    ) {
      throw new Error('Topic key has already been set')
    }
    this.topicKeys.set(contentTopic, key)
    this.topicParticipants.set(contentTopic, [counterparty])

    const walletAddress = counterparty.identityKey.walletSignatureAddress()
    const counterpartyTopicList = this.dmTopics.get(walletAddress) || []
    counterpartyTopicList.push({ contentTopic, createdAt })
    this.dmTopics.set(walletAddress, counterpartyTopicList)
  }

  // Would be used to get all information required to decrypt/validate a given message
  getTopicResult(contentTopic: string): TopicResult | undefined {
    const participants = this.topicParticipants.get(contentTopic)
    const topicKey = this.topicKeys.get(contentTopic)
    if (!participants || !participants.length || !topicKey) {
      return undefined
    }
    return {
      participants,
      topicKey,
      contentTopic,
    }
  }

  // Would be used to know which topic/key to use to send to a given wallet address
  getDirectMessageTopic(walletAddress: string): TopicResult | undefined {
    const walletTopics = this.dmTopics.get(walletAddress)
    if (!walletTopics || !walletTopics.length) {
      return undefined
    }
    const newestTopic = this.findLatestTopic(walletTopics)
    return this.getTopicResult(newestTopic.contentTopic)
  }

  addDelegateKey(record: PrivateKeyRecord): void {
    this.delegateKeys.push(record)
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
