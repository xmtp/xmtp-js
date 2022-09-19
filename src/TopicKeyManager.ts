import PublicKeyBundle from './crypto/PublicKeyBundle'

export enum EncryptionAlgorithm {
  AES_256_GCM_HKDF_SHA_256,
}

// TopicKeyRecord encapsulates the key, algorithm, and a list of allowed signers
export type TopicKeyRecord = {
  keyMaterial: Uint8Array
  encryptionAlgorithm: EncryptionAlgorithm
  // Callers should validate that the signature comes from the list of allowed signers
  // Not strictly necessary, but it prevents against compromised topic keys being
  // used by third parties who would sign the message with a different key
  allowedSigners: PublicKeyBundle[]
}

// TopicResult is the public interface for receiving a TopicKey
export type TopicResult = {
  topicKey: TopicKeyRecord
  contentTopic: string
}

// Internal data structure used to store the relationship between a topic and a wallet address
type WalletTopicRecord = {
  contentTopic: string
  createdAt: Date
}

type ContentTopic = string
type WalletAddress = string

export class DuplicateTopicError extends Error {
  constructor(topic: string) {
    super(`Topic ${topic} has already been added`)
    this.name = 'DuplicateTopicError'
    Object.setPrototypeOf(this, DuplicateTopicError.prototype)
  }
}

const findLatestTopic = (records: WalletTopicRecord[]): WalletTopicRecord => {
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

export default class TopicKeyManager {
  // Mapping of content topics to the keys used for decryption on that topic
  private topicKeys: Map<ContentTopic, TopicKeyRecord>
  // Mapping of wallet addresses and topics
  private dmTopics: Map<WalletAddress, WalletTopicRecord[]>

  constructor() {
    this.topicKeys = new Map<ContentTopic, TopicKeyRecord>()
    this.dmTopics = new Map<WalletAddress, WalletTopicRecord[]>()
  }

  // Create a TopicKeyRecord for the topic and store it for later access
  addDirectMessageTopic(
    contentTopic: string,
    key: TopicKeyRecord,
    counterparty: PublicKeyBundle,
    createdAt: Date
  ): void {
    if (this.topicKeys.has(contentTopic)) {
      throw new DuplicateTopicError(contentTopic)
    }
    this.topicKeys.set(contentTopic, key)

    const walletAddress = counterparty.identityKey.walletSignatureAddress()
    const counterpartyTopicList = this.dmTopics.get(walletAddress) || []
    counterpartyTopicList.push({ contentTopic, createdAt })
    this.dmTopics.set(walletAddress, counterpartyTopicList)
  }

  // Would be used to get all information required to decrypt/validate a given message
  getByTopic(contentTopic: string): TopicResult | undefined {
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
  getLatestByWalletAddress(walletAddress: string): TopicResult | undefined {
    const walletTopics = this.dmTopics.get(walletAddress)
    if (!walletTopics || !walletTopics.length) {
      return undefined
    }
    const newestTopic = findLatestTopic(walletTopics)
    return this.getByTopic(newestTopic.contentTopic)
  }

  // Would be used to get the topic list to listen for all messages from a given wallet address
  getAllByWalletAddress(walletAddress: string): TopicResult[] {
    const dmTopics = this.dmTopics
      .get(walletAddress)
      ?.map(({ contentTopic }) => this.getByTopic(contentTopic))
      .filter((res) => !!res) as TopicResult[]

    return dmTopics || []
  }
}
