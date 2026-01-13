import {
  contentTypeToString,
  type ContentCodec,
  type ContentTypeId,
} from "@xmtp/content-type-primitives";

export class CodecRegistry {
  #codecs: Map<string, ContentCodec>;

  constructor(codecs: ContentCodec[]) {
    this.#codecs = new Map(
      codecs.map((codec) => [contentTypeToString(codec.contentType), codec]),
    );
  }

  /**
   * Gets the codec for a given content type
   *
   * @param contentType - The content type to get the codec for
   * @returns The codec, if found
   */
  getCodec<ContentType = unknown>(contentType: ContentTypeId) {
    return this.#codecs.get(contentTypeToString(contentType)) as
      | ContentCodec<ContentType>
      | undefined;
  }
}
