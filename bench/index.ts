import {
  ConversationV1,
  ConversationV2,
} from './../src/conversations/Conversation'
import { PrivateKeyBundleV1 } from '../src/crypto/PrivateKeyBundle'
import { MessageV1 } from '../src/Message'
import { add, suite, save, cycle } from 'benny'
import { Client } from '../src'
import { crypto } from '../src/crypto/encryption'
import { newWallet, newLocalHostClient } from '../test/helpers'
import { utils } from '../src/crypto'
import { fetcher } from '@xmtp/proto'

const MESSAGE_SIZES = [128, 65536, 524288]
const MAX_RANDOM_BYTES_SIZE = 65536

const newPrivateKeyBundle = () => PrivateKeyBundleV1.generate(newWallet())

const randomBytes = (size: number) => {
  const out = new Uint8Array(size)
  let remaining = size
  while (remaining > 0) {
    const chunkSize =
      remaining < MAX_RANDOM_BYTES_SIZE ? remaining : MAX_RANDOM_BYTES_SIZE
    const chunk = crypto.getRandomValues(new Uint8Array(chunkSize))
    out.set(chunk, size - remaining)
    remaining -= MAX_RANDOM_BYTES_SIZE
  }
  return out
}

const encodeV1 = () => {
  return MESSAGE_SIZES.map((size) =>
    add(`encode and encrypt a ${size} byte v1 message`, async () => {
      const alice = await Client.create(newWallet(), { env: 'local' })
      const bobKeys = (await newPrivateKeyBundle()).getPublicKeyBundle()

      const message = randomBytes(size)
      const timestamp = new Date()

      // The returned function is the actual benchmark. Everything above is setup
      return async () => {
        const encodedMessage = await alice.encodeContent(message)
        await MessageV1.encode(
          alice.legacyKeys,
          bobKeys,
          encodedMessage,
          timestamp
        )
      }
    })
  )
}

const encodeV2 = () => {
  // All these sizes should take roughly the same amount of time
  return MESSAGE_SIZES.map((size) =>
    add(`encode and encrypt a ${size} byte v2 message`, async () => {
      const alice = await newLocalHostClient()
      const topicKey = utils.getRandomValues(new Uint8Array(32))
      const convo = new ConversationV2(
        alice,
        'xmtp/0/foo',
        topicKey,
        '0xf00',
        new Date(),
        undefined
      )
      const message = randomBytes(size)

      // The returned function is the actual benchmark. Everything above is setup
      return async () => {
        await convo.encodeMessage(message)
      }
    })
  )
}

const decodeV1 = () => {
  return MESSAGE_SIZES.map((size) =>
    add(`decode and decrypt a ${size} byte v1 message`, async () => {
      const alice = await newLocalHostClient()
      const bob = await newPrivateKeyBundle()

      const message = randomBytes(size)
      const encodedMessage = await MessageV1.encode(
        alice.legacyKeys,
        bob.getPublicKeyBundle(),
        await alice.encodeContent(message),
        new Date()
      )
      const messageBytes = encodedMessage.toBytes()

      const convo = new ConversationV1(
        alice,
        bob.identityKey.publicKey.walletSignatureAddress(),
        new Date()
      )

      const envelope = {
        contentTopic: convo.topic,
        message: fetcher.b64Encode(
          messageBytes,
          0,
          messageBytes.length
        ) as unknown as Uint8Array,
      }

      return async () => {
        await convo.decodeMessage(envelope)
      }
    })
  )
}

const decodeV2 = () => {
  return MESSAGE_SIZES.map((size) =>
    add(`decode and decrypt a ${size} byte v2 message`, async () => {
      const alice = await newLocalHostClient()
      const bob = await newPrivateKeyBundle()

      const message = randomBytes(size)
      const convo = new ConversationV2(
        alice,
        'xmtp/0/foo',
        utils.getRandomValues(new Uint8Array(32)),
        bob.identityKey.publicKey.walletSignatureAddress(),
        new Date(),
        undefined
      )
      const encodedMessage = await convo.encodeMessage(message)
      const messageBytes = encodedMessage.toBytes()

      const envelope = {
        contentTopic: convo.topic,
        message: fetcher.b64Encode(
          messageBytes,
          0,
          messageBytes.length
        ) as unknown as Uint8Array,
      }

      return async () => {
        await convo.decodeMessage(envelope)
      }
    })
  )
}

// Async test suites should be wrapped in a function so that they can be run one at a time
const wrapSuite =
  (name: string, ...tests: any[]) =>
  () =>
    suite(
      name,
      ...tests,
      cycle(),
      save({ file: name, folder: 'bench/results', format: 'json' }),
      save({ file: name, folder: 'bench/results', format: 'table.html' }),
      save({ file: name, folder: 'bench/results', format: 'chart.html' })
    )

const encodeSuite = wrapSuite('encode', ...encodeV1(), ...encodeV2())
const decodeSuite = wrapSuite('decode', ...decodeV1(), ...decodeV2())

const main = async () => {
  await encodeSuite()
  await decodeSuite()
}

main()
