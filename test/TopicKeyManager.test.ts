import {
  TopicKeyRecord,
  EncryptionAlgorithm,
  DuplicateTopicError,
} from './../src/TopicKeyManager'
import KeyManager from '../src/TopicKeyManager'
import { crypto } from '../src/crypto/encryption'
import { PrivateKeyBundleV1 } from '../src/crypto/PrivateKeyBundle'
import { PublicKeyBundle } from '../src/crypto/PublicKeyBundle'
import { newWallet } from './helpers'

const TOPICS = ['topic1', 'topic2']

const createTopicKeyRecord = (
  allowedSigners: PublicKeyBundle[] = []
): TopicKeyRecord => {
  return {
    keyMaterial: crypto.getRandomValues(new Uint8Array(32)),
    encryptionAlgorithm: EncryptionAlgorithm.AES_256_GCM_HKDF_SHA_256,
    allowedSigners: allowedSigners,
  }
}

describe('TopicKeyManager', () => {
  let keyManager: KeyManager
  beforeEach(async () => {
    keyManager = new KeyManager()
  })

  it('can add and retrieve a topic key', async () => {
    const senderWallet = newWallet()
    const sender = (
      await PrivateKeyBundleV1.generate(senderWallet)
    ).getPublicKeyBundle()
    const sentAt = new Date()
    const record = createTopicKeyRecord([sender])

    keyManager.addDirectMessageTopic(TOPICS[0], record, sender, sentAt)

    // Lookup latest result by address
    const topicResultByAddress = keyManager.getLatestByWalletAddress(
      senderWallet.address
    )
    expect(topicResultByAddress?.contentTopic).toEqual(TOPICS[0])
    expect(topicResultByAddress?.topicKey.keyMaterial).toEqual(
      record.keyMaterial
    )

    // Lookup all results by address
    const allResults = keyManager.getAllByWalletAddress(senderWallet.address)
    expect(allResults).toHaveLength(1)
    expect(allResults[0]).toEqual(topicResultByAddress)

    // Lookup result by topic
    const topicResultByTopic = keyManager.getByTopic(TOPICS[0])
    expect(topicResultByTopic).toEqual(topicResultByAddress)
  })

  it('returns undefined when no topic key has been added', async () => {
    expect(keyManager.getByTopic(TOPICS[0])).toBeUndefined()
    expect(keyManager.getLatestByWalletAddress(TOPICS[0])).toBeUndefined()
    expect(keyManager.getAllByWalletAddress(TOPICS[0])).toHaveLength(0)
  })

  it('can add multiple topic keys for a wallet', async () => {
    const senderWallet = newWallet()
    const sender = (
      await PrivateKeyBundleV1.generate(senderWallet)
    ).getPublicKeyBundle()
    const record1 = createTopicKeyRecord([sender])
    const record2 = createTopicKeyRecord([sender])
    const d1 = new Date(+new Date() - 100)
    const d2 = new Date()

    keyManager.addDirectMessageTopic(TOPICS[0], record1, sender, d1)
    keyManager.addDirectMessageTopic(TOPICS[1], record2, sender, d2)

    // Should use the record with the latest date
    expect(
      keyManager.getLatestByWalletAddress(senderWallet.address)?.contentTopic
    ).toEqual(TOPICS[1])

    // Should return both results
    expect(keyManager.getAllByWalletAddress(senderWallet.address)).toHaveLength(
      2
    )

    // It should still be possible to look up the older topic using the topic name directly
    expect(keyManager.getByTopic(TOPICS[0])?.topicKey.keyMaterial).toEqual(
      record1.keyMaterial
    )
  })

  it('cannot add multiple records for the same topic', async () => {
    const senderWallet = newWallet()
    const sender = (
      await PrivateKeyBundleV1.generate(senderWallet)
    ).getPublicKeyBundle()

    keyManager.addDirectMessageTopic(
      TOPICS[0],
      createTopicKeyRecord([sender]),
      sender,
      new Date()
    )

    expect(() =>
      keyManager.addDirectMessageTopic(
        TOPICS[0],
        createTopicKeyRecord([sender]),
        sender,
        new Date()
      )
    ).toThrow(DuplicateTopicError)
  })
})
