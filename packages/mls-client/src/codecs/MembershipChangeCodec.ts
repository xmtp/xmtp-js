import { mlsTranscriptMessages } from '@xmtp/proto'
import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from '@xmtp/xmtp-js'

export const ContentTypeMembershipChange = new ContentTypeId({
  authorityId: 'xmtp.org',
  typeId: 'group_membership_change',
  versionMajor: 1,
  versionMinor: 0,
})

export class MembershipChangeCodec
  implements ContentCodec<mlsTranscriptMessages.MembershipChange>
{
  get contentType(): ContentTypeId {
    return ContentTypeMembershipChange
  }

  encode(content: mlsTranscriptMessages.MembershipChange): EncodedContent {
    return {
      type: this.contentType,
      parameters: {},
      content: mlsTranscriptMessages.MembershipChange.encode(content).finish(),
    }
  }

  decode(content: EncodedContent): mlsTranscriptMessages.MembershipChange {
    return mlsTranscriptMessages.MembershipChange.decode(content.content)
  }

  fallback(): undefined {
    return undefined
  }

  shouldPush() {
    return false
  }
}
