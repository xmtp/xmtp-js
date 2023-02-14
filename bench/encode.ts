import { ConversationV2 } from './../src/conversations/Conversation'
import { MessageV1 } from '../src/Message'
import { add } from 'benny'
import { Client } from '../src'
import { newWallet, newLocalHostClient } from '../test/helpers'
import { utils } from '../src/crypto'
import {
  MESSAGE_SIZES,
  newPrivateKeyBundle,
  randomBytes,
  wrapSuite,
} from './helpers'

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

export default wrapSuite('encode', ...encodeV1(), ...encodeV2())
