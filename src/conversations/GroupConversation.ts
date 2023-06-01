import Client from '../Client'
import { Conversation, ConversationV2 } from './Conversation'
import { InvitationContext } from '../Invitation'
import { PublicKeyBundle, SignedPublicKeyBundle } from '../crypto'
import { toSignedPublicKeyBundle } from '../keystore/utils'
import { buildUserInviteTopic, dateToNs } from '../utils'

export class GroupConversation extends ConversationV2 implements Conversation {
  client: Client
  peerAddress: string
  topic: string
  createdAt: Date
  memberAddresses: string[] = []
  isGroup = true

  constructor(
    client: Client,
    topic: string,
    peerAddress: string,
    createdAt: Date,
    context: InvitationContext | undefined,
    membersAddresses: string[]
  ) {
    super(client, topic, peerAddress, createdAt, context)
    this.topic = topic
    this.createdAt = createdAt
    this.context = context
    this.client = client
    this.peerAddress = peerAddress
    this.memberAddresses = membersAddresses
  }

  static from(
    conversation: Conversation,
    members?: string[]
  ): GroupConversation {
    if (!(conversation instanceof ConversationV2)) {
      throw new Error('Conversation is not a V2 conversation')
    }

    const memberAddresses =
      members ||
      conversation.context?.metadata?.initialMembers?.split(',') ||
      []

    if (memberAddresses.length === 0) {
      throw new Error('Conversation has no member addresses')
    }

    return new GroupConversation(
      conversation.client,
      conversation.topic,
      conversation.peerAddress,
      conversation.createdAt,
      conversation.context,
      memberAddresses
    )
  }

  async addMember(newMemberAddress: string) {
    const timestamp = new Date()

    let contact = await this.client.getUserContact(newMemberAddress)
    if (!contact) {
      throw new Error(
        `Recipient ${newMemberAddress} is not on the XMTP network`
      )
    }

    // Coerce the contact into a V2 bundle
    if (contact instanceof PublicKeyBundle) {
      contact = SignedPublicKeyBundle.fromLegacyBundle(contact)
    }

    const recipient = toSignedPublicKeyBundle(contact)

    const inviteResponse = await this.client.keystore.createInviteFromTopic({
      contentTopic: this.topic,
      recipient,
      createdNs: dateToNs(timestamp),
    })

    if (!inviteResponse.conversation) {
      throw new Error(
        'no conversation for response: ' + JSON.stringify(inviteResponse)
      )
    }

    const envelope = {
      contentTopic: buildUserInviteTopic(newMemberAddress),
      message: inviteResponse.payload,
      timestamp,
    }

    await this.client.publishEnvelopes([envelope])
  }
}
