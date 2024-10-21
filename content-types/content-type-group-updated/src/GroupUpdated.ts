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

export type GroupUpdated = mlsTranscriptMessages.GroupUpdated;

export class GroupUpdatedCodec
  implements ContentCodec<GroupUpdated, Record<string, never>>
{
  get contentType(): ContentTypeId {
    return ContentTypeGroupUpdated;
  }

  encode(content: GroupUpdated) {
    return {
      type: this.contentType,
      parameters: {},
      content: mlsTranscriptMessages.GroupUpdated.encode(content).finish(),
    };
  }

  decode(content: EncodedContent) {
    return mlsTranscriptMessages.GroupUpdated.decode(content.content);
  }

  fallback(): undefined {
    return undefined;
  }

  shouldPush() {
    return false;
  }
}
