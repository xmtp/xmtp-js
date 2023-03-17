import {
  ConversationV1,
  ConversationV2,
} from './../src/conversations/Conversation'
import { MessageV1 } from '../src/Message'
import { newLocalHostClient } from '../test/helpers'
import { SignedPublicKeyBundle } from '../src/crypto'
import {
  MESSAGE_SIZES,
  newPrivateKeyBundle,
  randomBytes,
  wrapSuite,
} from './helpers'
import { add } from 'benny'
import { fetcher } from '@xmtp/proto'
import { dateToNs } from '../src/utils'

const decodeV1 = () => {
  return MESSAGE_SIZES.map((size) =>
    add(`decode and decrypt a ${size} byte v1 message`, async () => {
      const alice = await newLocalHostClient()
      const bob = await newPrivateKeyBundle()

      const message = randomBytes(size)
      const encodedMessage = await MessageV1.encode(
        alice.keystore,
        message,
        alice.publicKeyBundle,
        bob.getPublicKeyBundle(),
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
      const invite = await alice.keystore.createInvite({
        recipient: SignedPublicKeyBundle.fromLegacyBundle(
          bob.getPublicKeyBundle()
        ),
        createdNs: dateToNs(new Date()),
        context: undefined,
      })
      const convo = new ConversationV2(
        alice,
        invite.conversation?.topic ?? '',
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

export default wrapSuite('decode', ...decodeV1(), ...decodeV2())
