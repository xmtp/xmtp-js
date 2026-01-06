import type { ContentTypeId, EncodedContent } from "@xmtp/node-bindings";

export type ContentCodec<ContentType = unknown> = {
  contentType: ContentTypeId;
  encode(content: ContentType): EncodedContent;
  decode(content: EncodedContent): ContentType;
  fallback(content: ContentType): string | undefined;
  shouldPush: (content: ContentType) => boolean;
};

/**
 * Compares two content type IDs for equality
 *
 * @param a - First content type ID
 * @param b - Second content type ID
 * @returns True if the content type IDs are equal
 */
export const contentTypesAreEqual = (a: ContentTypeId, b: ContentTypeId) =>
  a.authorityId === b.authorityId && a.typeId === b.typeId;

/**
 * Converts a content type ID to a string
 *
 * @param contentType - Content type ID
 * @returns String representation of the content type ID
 */
export const contentTypeToString = (contentType: ContentTypeId) =>
  `${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}`;

const contentTypeStringRegex = /^([^/]+)\/([^:]+):(\d+)\.(\d+)$/;

/**
 * Converts a string to a content type ID
 *
 * @param contentTypeString - String representation of the content type ID
 * @returns Content type ID
 * @throws Error if the string does not match the expected format
 */
export const contentTypeFromString = (
  contentTypeString: string,
): ContentTypeId => {
  const match = contentTypeString.match(contentTypeStringRegex);
  if (!match) {
    throw new Error(
      `Invalid content type string: "${contentTypeString}". Expected format: "authorityId/typeId:majorVersion.minorVersion"`,
    );
  }
  const [, authorityId, typeId, major, minor] = match;
  return {
    authorityId,
    typeId,
    versionMajor: Number(major),
    versionMinor: Number(minor),
  };
};

export type { ContentTypeId, EncodedContent };
