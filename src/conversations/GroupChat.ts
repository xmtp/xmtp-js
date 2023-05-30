import {
  Client,
  Conversation,
  GroupConversation,
  SortDirection,
} from '../index'
import {
  ContentTypeGroupChatMemberAdded,
  GroupChatMemberAdded,
  GroupChatMemberAddedCodec,
} from '../codecs/GroupChatMemberAdded'
import {
  ContentTypeGroupChatTitleChanged,
  GroupChatTitleChanged,
  GroupChatTitleChangedCodec,
} from '../codecs/GroupChatTitleChanged'

type RebuildOptions = {
  since: Date
}

export class GroupChat {
  static codecs = [
    new GroupChatMemberAddedCodec(),
    new GroupChatTitleChangedCodec(),
  ]

  static registerCodecs(client: Client) {
    for (const codec of GroupChat.codecs) {
      client.registerCodec(codec)
    }
  }

  title = ''
  memberClient: Client
  conversation: Conversation
  _members: string[] = []
  _memberConversation: Conversation | undefined

  get members(): string[] {
    return [...new Set(this._members)]
  }

  set members(members: string[]) {
    this._members = [...new Set(members)]
  }

  constructor(memberClient: Client, conversation: Conversation) {
    this.memberClient = memberClient
    this.conversation = conversation
  }

  static async fromConversation(
    client: Client,
    conversation: Conversation
  ): Promise<GroupChat> {
    const groupChat = new GroupChat(client, conversation)
    await groupChat.rebuild()

    return groupChat
  }

  async rebuild(opts?: RebuildOptions | undefined) {
    const members =
      this.conversation.context?.metadata.initialMembers.split(',')

    if (!members) {
      throw new Error('Conversation is not a group chat')
    }

    this._members = members

    const startTime = opts?.since

    const messages = startTime
      ? await this.conversation.messages({
          startTime,
          direction: SortDirection.SORT_DIRECTION_ASCENDING,
        })
      : await this.conversation.messages()

    for (const message of messages) {
      if (message.contentType.sameAs(ContentTypeGroupChatMemberAdded)) {
        const groupChatMemberAdded = message.content as GroupChatMemberAdded
        this._members.push(groupChatMemberAdded.member)
      } else if (message.contentType.sameAs(ContentTypeGroupChatTitleChanged)) {
        const groupChatTitleChanged = message.content as GroupChatTitleChanged
        this.title = groupChatTitleChanged.newTitle
      }
    }
  }

  async changeTitle(newTitle: string) {
    const titleChange: GroupChatTitleChanged = {
      oldTitle: this.title,
      newTitle,
    }

    await this.conversation.send(titleChange, {
      contentType: ContentTypeGroupChatTitleChanged,
      contentFallback: `${this.memberClient.address} changed the group title to ${newTitle}`,
    })
  }

  async addMember(newMemberAddress: string) {
    const memberAdded: GroupChatMemberAdded = {
      member: newMemberAddress,
    }

    this._members.push(newMemberAddress)

    const conversation = GroupConversation.from(this.conversation, this.members)
    await conversation.addMember(newMemberAddress)

    await this.conversation.send(memberAdded, {
      contentType: ContentTypeGroupChatMemberAdded,
      contentFallback: `${this.memberClient.address} added ${newMemberAddress} to the group`,
    })
  }
}
