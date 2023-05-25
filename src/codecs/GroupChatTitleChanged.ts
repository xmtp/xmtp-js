import { ContentCodec, ContentTypeId, EncodedContent } from '../index'

export const ContentTypeGroupChatTitleChanged: ContentTypeId = {
  typeId: 'groupChatTitleChanged',
  authorityId: 'xmtp.org',
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

export type GroupChatTitleChanged = {
  // The new title
  newTitle: string

  // The old title
  oldTitle: string
}

export class GroupChatTitleChangedCodec
  implements ContentCodec<GroupChatTitleChanged>
{
  contentType = ContentTypeGroupChatTitleChanged

  encode(content: GroupChatTitleChanged): EncodedContent {
    return {
      type: ContentTypeGroupChatTitleChanged,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    }
  }

  decode(encodedContent: EncodedContent): GroupChatTitleChanged {
    const json = new TextDecoder().decode(encodedContent.content)
    return JSON.parse(json)
  }
}
