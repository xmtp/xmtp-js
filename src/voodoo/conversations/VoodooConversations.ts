import { messageApi } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import VoodooClient, { VoodooContact } from '../VoodooClient'
import VoodooConversation from './VoodooConversation'
import { utils } from '../../crypto'

import {
  buildVoodooUserInviteTopic,
  buildVoodooDirectMessageTopic,
} from '../utils'

export default class VoodooConversations {
  private client: VoodooClient
  private conversations: Map<string, VoodooConversation> = new Map()
  private convoMutex: Mutex

  constructor(client: VoodooClient) {
    this.client = client
    this.convoMutex = new Mutex()
  }

  async list(): Promise<VoodooConversation[]> {
    const release = await this.convoMutex.acquire()
    try {
      // Check for new conversations in our invite topic
      const inviteTopic = buildVoodooUserInviteTopic(this.client.address)
      const newConvosFromInvites = await this.client.listEnvelopes(
        inviteTopic,
        this.processInvite.bind(this)
      )

      for (const convo of newConvosFromInvites) {
        if (convo) {
          this.conversations.set(convo.peerAddress, convo)
        }
      }
      return Array.from(this.conversations.values())
    } finally {
      release()
    }
  }

  // Must be locked by convoMutex
  async processInvite(
    env: messageApi.Envelope
  ): Promise<VoodooConversation | undefined> {
    // TODO: Check if we have a conversation for this peer already, may need
    // to add additional metadata to our message body

    // Get env.message and call this.client.decodeEnvelope on it to get a raw string
    // in this case, this is JSON encoded pickled Olm PreKey message
    const olmJson = await this.client.decodeEnvelope(env)
    // Try to process as inbound
    const inboundSessionResult = await this.client.processInboundSessionJson(
      this.client.address,
      olmJson
    )
    if (inboundSessionResult) {
      const { sessionId, message } = inboundSessionResult
      const conversation = new VoodooConversation(
        this.client,
        sessionId,
        message.content, // the content of the prekey message is the new convo topic
        message.senderAddress,
        message.timestamp
      )
      return conversation
    }
  }

  /**
   * Creates a new VoodooConversation for the given address. Will throw an error if the peer is not found in the XMTP network
   */
  async newConversation(peerAddress: string): Promise<VoodooConversation> {
    const contact = await this.client.getUserContactFromNetwork(peerAddress)
    if (!contact) {
      throw new Error(
        `Voodoo recipient ${peerAddress} is not on the XMTP network`
      )
    }

    // Better be a VoodooContact type
    if (!contact.voodooInstance) {
      throw new Error(`Voodoo recipient ${peerAddress} is not a Voodoo contact`)
    }

    // TODO: add more context eventually
    const matcherFn = (convo: VoodooConversation) =>
      convo.peerAddress === peerAddress

    return this.convoMutex.runExclusive(async () => {
      const existing = Array.from(this.conversations.values())
      const existingMatch = existing.find(matcherFn)
      if (existingMatch) {
        return existingMatch
      }

      // Create a new VoodooConversation
      const convo = await this.createConvo(contact as VoodooContact)
      this.conversations.set(peerAddress, convo)
      return convo
    })
  }

  // TODO: We need to rename outbound/inbound into invites of some sort
  // Currently, we generate a random topic for the session, and send an Olm PreKey Message
  // where the encrypted ciphertext is just the random topic. This is the "invite" message.
  // The recipient processes the Olm PreKey Message and gets the random topic, and then
  // creates their own VoodooConversation from the derived session and the included topic.
  private async createConvo(
    recipient: VoodooContact
  ): Promise<VoodooConversation> {
    const timestamp = new Date()

    // Generate the random topic for the session and set it as the first
    // plaintext message sent
    const generatedSessionTopic = buildVoodooDirectMessageTopic(
      Buffer.from(utils.getRandomValues(new Uint8Array(32)))
        .toString('base64')
        .replace(/=*$/g, '')
        // Replace slashes with dashes so that the topic is still easily split by /
        // We do not treat this as needing to be valid Base64 anywhere
        .replace('/', '-')
    )

    // Create an outbound session with { sessionId: string, paylaod: string (encoded Olm PreKey Message) }
    const outboundObject = await this.client.getOutboundSessionJson(
      recipient.address,
      generatedSessionTopic
    )

    if (!outboundObject) {
      throw new Error('Could not create outbound session')
    }

    // TODO: should derive this from wallet signature
    const peerAddress = recipient.address

    // Only publish to the peer's inbox, store the conversation locally
    await this.client.publishEnvelopes([
      {
        contentTopic: buildVoodooUserInviteTopic(peerAddress),
        message: Buffer.from(outboundObject.prekeyMessage),
        timestamp,
      },
    ])

    const convo = new VoodooConversation(
      this.client,
      outboundObject.sessionId,
      generatedSessionTopic,
      peerAddress,
      timestamp
    )
    return convo
  }
}
