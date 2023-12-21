import { ContentTypeId } from "@xmtp/xmtp-js";
import type { ContentCodec, EncodedContent } from "@xmtp/xmtp-js";

export type EffectType = "SNOW" | "RAIN";

export const ContentTypeScreenEffect = new ContentTypeId({
  authorityId: "experimental.xmtp.org",
  typeId: "screenEffect",
  versionMajor: 1,
  versionMinor: 0,
});

export type ScreenEffect = {
  messageId: string;
  effectType: EffectType;
};

export type ScreenEffectParameters = Pick<
  ScreenEffect,
  "messageId" | "effectType"
>;

export class ScreenEffectCodec
  implements ContentCodec<ScreenEffect | undefined>
{
  get contentType(): ContentTypeId {
    return ContentTypeScreenEffect;
  }

  encode(content: ScreenEffect): EncodedContent<ScreenEffectParameters> {
    return {
      type: ContentTypeScreenEffect,
      parameters: {
        messageId: content.messageId,
        effectType: content.effectType,
      },
      content: new Uint8Array(),
    };
  }

  decode(
    content: EncodedContent<ScreenEffectParameters>,
  ): ScreenEffect | undefined {
    const { messageId, effectType } = content.parameters;

    return {
      messageId,
      effectType,
    };
  }

  fallback() {
    return undefined;
  }
}
