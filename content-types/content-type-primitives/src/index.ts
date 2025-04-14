import type { content } from "@xmtp/proto";

export class ContentTypeId {
  authorityId: string;

  typeId: string;

  versionMajor: number;

  versionMinor: number;

  constructor(obj: content.ContentTypeId) {
    this.authorityId = obj.authorityId;
    this.typeId = obj.typeId;
    this.versionMajor = obj.versionMajor;
    this.versionMinor = obj.versionMinor;
  }

  toString(): string {
    return `${this.authorityId}/${this.typeId}:${this.versionMajor}.${this.versionMinor}`;
  }

  static fromString(contentTypeString: string): ContentTypeId {
    const [idString, versionString] = contentTypeString.split(":");
    const [authorityId, typeId] = idString.split("/");
    const [major, minor] = versionString.split(".");
    return new ContentTypeId({
      authorityId,
      typeId,
      versionMajor: Number(major),
      versionMinor: Number(minor),
    });
  }

  sameAs(id: ContentTypeId): boolean {
    return this.authorityId === id.authorityId && this.typeId === id.typeId;
  }
}

export type EncodedContent<Parameters = Record<string, string>> = {
  type: ContentTypeId;
  parameters: Parameters;
  fallback?: string;
  compression?: number;
  content: Uint8Array;
};

export type ContentCodec<
  ContentType = unknown,
  Parameters = Record<string, string>,
> = {
  contentType: ContentTypeId;
  encode(
    content: ContentType,
    registry: CodecRegistry,
  ): EncodedContent<Parameters>;
  decode(
    content: EncodedContent<Parameters>,
    registry: CodecRegistry,
  ): ContentType;
  fallback(content: ContentType): string | undefined;
  shouldPush: (content: ContentType) => boolean;
};

/**
 * An interface implemented for accessing codecs by content type.
 */
export interface CodecRegistry<T = unknown> {
  codecFor(contentType: ContentTypeId): ContentCodec<T> | undefined;
}

export type CodecMap<T = unknown> = Map<string, ContentCodec<T>>;
