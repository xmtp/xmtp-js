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
import {
  ContentTypeGroupChatMemberNicknameChanged,
  GroupChatMemberNicknameChanged,
  GroupChatMemberNicknameChangedCodec,
} from '../codecs/GroupChatMemberNicknameChanged'

type RebuildOptions = {
  since: Date
}

export class GroupChat {
  static contentTypes = [
    ContentTypeGroupChatMemberAdded,
    GroupChatTitleChangedCodec,
    ContentTypeGroupChatMemberNicknameChanged,
  ]

  static codecs = [
    new GroupChatMemberAddedCodec(),
    new GroupChatTitleChangedCodec(),
    new GroupChatMemberNicknameChangedCodec(),
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
  _nicknames: { [member: string]: string } = {}

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
      } else if (
        message.contentType.sameAs(ContentTypeGroupChatMemberNicknameChanged)
      ) {
        const nicknameChange = message.content as GroupChatMemberNicknameChanged
        this._nicknames[message.senderAddress] = nicknameChange.newNickname
      }
    }
  }

  get memberNickname(): string {
    return this._nicknames[this.memberClient.address] || ''
  }

  nicknameFor(address: string): string {
    return this._nicknames[address] || address
  }

  async changeNickname(newNickname: string) {
    const oldNickname =
      this.memberNickname === ''
        ? this.memberClient.address
        : this.memberNickname
    const nicknameChange: GroupChatMemberNicknameChanged = {
      newNickname,
    }

    await this.conversation.send(nicknameChange, {
      contentType: ContentTypeGroupChatMemberNicknameChanged,
      contentFallback: `${oldNickname} changed their nickname to ${newNickname}`,
    })
  }

  async changeTitle(newTitle: string) {
    const titleChange: GroupChatTitleChanged = {
      oldTitle: this.title,
      newTitle,
    }

    await this.conversation.send(titleChange, {
      contentType: ContentTypeGroupChatTitleChanged,
      contentFallback: `${this.nicknameFor(
        this.memberClient.address
      )} changed the group title to ${newTitle}`,
    })
  }

  async addMember(newMemberAddress: string) {
    const memberAdded: GroupChatMemberAdded = {
      member: newMemberAddress,
    }

    await this.conversation.send(memberAdded, {
      contentType: ContentTypeGroupChatMemberAdded,
      contentFallback: `${this.nicknameFor(
        this.memberClient.address
      )} added ${newMemberAddress} to the group`,
    })

    this._members.push(newMemberAddress)

    const conversation = GroupConversation.from(this.conversation, this.members)
    await conversation.addMember(newMemberAddress)
  }
}
