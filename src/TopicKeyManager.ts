import Long from 'long'
import { SignedPublicKeyBundle } from './crypto/PublicKeyBundle'

export enum EncryptionAlgorithm {
  AES_256_GCM_HKDF_SHA_256,
}

/**
 * TopicKeyRecord encapsulates the key, algorithm, and a list of allowed signers
 */
export type TopicKeyRecord = {
  keyMaterial: Uint8Array
  encryptionAlgorithm: EncryptionAlgorithm
  // Callers should validate that the signature comes from the list of allowed signers
  // Not strictly necessary, but it prevents against compromised topic keys being
  // used by third parties who would sign the message with a different key
  allowedSigners: SignedPublicKeyBundle[]
}

/**
 * TopicResult is the public interface for receiving a TopicKey
 */
export type TopicResult = {
  topicKey: TopicKeyRecord
  contentTopic: string
}

// Internal data structure used to store the relationship between a topic and a wallet address
type WalletTopicRecord = {
  contentTopic: string
  createdAtNs: Long
}

type ContentTopic = string
type WalletAddress = string

/**
 * Custom error type for cases where the caller attempted to add a second key to the same topic
 */
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
    if (
      !latestRecord ||
      record.createdAtNs.greaterThan(latestRecord.createdAtNs)
    ) {
      latestRecord = record
    }
  }
  if (!latestRecord) {
    throw new Error('No record found')
  }
  return latestRecord
}

/**
 * TopicKeyManager stores the mapping between topics -> keys and wallet addresses -> keys
 */
export default class TopicKeyManager {
  // Mapping of content topics to the keys used for decryption on that topic
  private topicKeys: Map<ContentTopic, TopicKeyRecord>
  // Mapping of wallet addresses and topics
  private dmTopics: Map<WalletAddress, WalletTopicRecord[]>
  // The newest record in the store's timestamp in nanoseconds
  private newestRecord: Long

  constructor() {
    this.topicKeys = new Map<ContentTopic, TopicKeyRecord>()
    this.dmTopics = new Map<WalletAddress, WalletTopicRecord[]>()
    this.newestRecord = new Long(0)
  }

  /**
   * Create a TopicKeyRecord for the topic and store it for later access
   *
   * @param contentTopic The topic
   * @param key TopicKeyRecord that contains the topic key and encryption algorithm
   * @param counterparty The other user's PublicKeyBundle
   * @param createdAtNs Date in nanoseconds
   */
  async addDirectMessageTopic(
    contentTopic: string,
    key: TopicKeyRecord,
    counterparty: SignedPublicKeyBundle,
    createdAtNs: Long
  ): Promise<void> {
    if (this.topicKeys.has(contentTopic)) {
      throw new DuplicateTopicError(contentTopic)
    }
    this.topicKeys.set(contentTopic, key)

    const walletAddress =
      await counterparty.identityKey.walletSignatureAddress()
    const counterpartyTopicList = this.dmTopics.get(walletAddress) || []
    counterpartyTopicList.push({ contentTopic, createdAtNs })
    this.dmTopics.set(walletAddress, counterpartyTopicList)
    if (createdAtNs.greaterThan(this.newestRecord)) {
      this.newestRecord = createdAtNs
    }
  }

  /**
   * Would be used to get all information required to decrypt/validate a given message
   */
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

  /**
   *  Used to know which topic/key to use to send to a given wallet address
   */
  getLatestByWalletAddress(walletAddress: string): TopicResult | undefined {
    const walletTopics = this.dmTopics.get(walletAddress)
    if (!walletTopics || !walletTopics.length) {
      return undefined
    }
    const newestTopic = findLatestTopic(walletTopics)
    return this.getByTopic(newestTopic.contentTopic)
  }

  /**
   * Used to get the topic list to listen for all messages from a given wallet address
   */
  getAllByWalletAddress(walletAddress: string): TopicResult[] {
    const dmTopics = this.dmTopics
      .get(walletAddress)
      ?.map(({ contentTopic }) => this.getByTopic(contentTopic))
      .filter((res) => !!res) as TopicResult[]

    return dmTopics || []
  }
}
