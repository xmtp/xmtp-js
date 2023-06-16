import { ContentTypeId, ContentCodec, EncodedContent } from '../MessageContent'

export const ContentTypeGroupChatMemberAdded = new ContentTypeId({
  typeId: 'groupChatMemberAdded',
  authorityId: 'xmtp.org',
  versionMajor: 1,
  versionMinor: 0,
})

export type GroupChatMemberAdded = {
  member: string
}

export class GroupChatMemberAddedCodec
  implements ContentCodec<GroupChatMemberAdded>
{
  contentType = ContentTypeGroupChatMemberAdded

  encode(content: GroupChatMemberAdded): EncodedContent {
    if (content.member.length !== 42) {
      throw new Error('Invalid member address')
    }

    return {
      type: ContentTypeGroupChatMemberAdded,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    }
  }

  decode(encodedContent: EncodedContent): GroupChatMemberAdded {
    const json = new TextDecoder().decode(encodedContent.content)
    return JSON.parse(json)
  }
}
