import { ContentCodec, ContentTypeId, EncodedContent } from '../index'

export const ContentTypeGroupChatMemberNicknameChanged: ContentTypeId = {
  typeId: 'groupChatMemberNicknameChanged',
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

export type GroupChatMemberNicknameChanged = {
  // The new title
  newNickname: string
}

export class GroupChatMemberNicknameChangedCodec
  implements ContentCodec<GroupChatMemberNicknameChanged>
{
  contentType = ContentTypeGroupChatMemberNicknameChanged

  encode(content: GroupChatMemberNicknameChanged): EncodedContent {
    return {
      type: ContentTypeGroupChatMemberNicknameChanged,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    }
  }

  decode(encodedContent: EncodedContent): GroupChatMemberNicknameChanged {
    const json = new TextDecoder().decode(encodedContent.content)
    return JSON.parse(json)
  }
}
