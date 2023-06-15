import { ContentCodec, ContentTypeId, EncodedContent } from '../index'

export const ContentTypeGroupChatTitleChanged = new ContentTypeId({
  typeId: 'groupChatTitleChanged',
  authorityId: 'xmtp.org',
  versionMajor: 1,
  versionMinor: 0,
})

export type GroupChatTitleChanged = {
  newTitle: string
}

export class GroupChatTitleChangedCodec
  implements ContentCodec<GroupChatTitleChanged>
{
  contentType = ContentTypeGroupChatTitleChanged

  encode(content: GroupChatTitleChanged): EncodedContent {
    if (content.newTitle.length === 0 || content.newTitle.length > 256) {
      throw new Error('Invalid newTitle')
    }

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
