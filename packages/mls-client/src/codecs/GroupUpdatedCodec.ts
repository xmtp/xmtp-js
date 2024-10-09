import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { mlsTranscriptMessages } from "@xmtp/proto";

export const ContentTypeGroupUpdated = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "group_updated",
  versionMajor: 1,
  versionMinor: 0,
});

export class GroupUpdatedCodec
  implements ContentCodec<mlsTranscriptMessages.GroupUpdated>
{
  get contentType(): ContentTypeId {
    return ContentTypeGroupUpdated;
  }

  encode(content: mlsTranscriptMessages.GroupUpdated): EncodedContent {
    return {
      type: this.contentType,
      parameters: {},
      content: mlsTranscriptMessages.GroupUpdated.encode(content).finish(),
    };
  }

  decode(content: EncodedContent): mlsTranscriptMessages.GroupUpdated {
    return mlsTranscriptMessages.GroupUpdated.decode(content.content);
  }

  fallback(): undefined {
    return undefined;
  }

  shouldPush() {
    return false;
  }
}
