import { ContentCodec, ContentTypeId, EncodedContent } from '../index'

export const ContentTypeGroupChatMemberAdded: ContentTypeId = {
  typeId: 'groupChatMemberAdded',
  authorityId: 'pat.xmtp.com',
  versionMajor: 1,
  versionMinor: 0,
  sameAs(id) {
    return (
      this.typeId === id.typeId &&
      this.authorityId === id.authorityId &&
      this.versionMajor === id.versionMajor &&
      this.versionMinor === id.versionMinor
    )
  },
}

export type GroupChatMemberAdded = {
  member: string
}

export class GroupChatMemberAddedCodec
  implements ContentCodec<GroupChatMemberAdded>
{
  contentType = ContentTypeGroupChatMemberAdded

  encode(content: GroupChatMemberAdded): EncodedContent {
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
