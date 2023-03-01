import { ContentCodec, ContentTypeId, EncodedContent } from "@xmtp/xmtp-js";
import { CodecRegistry } from "@xmtp/xmtp-js/dist/types/src/MessageContent";
export declare const ContentTypeAttachment: ContentTypeId;
export type Attachment = {
    filename: string;
    mimeType: string;
    data: Uint8Array;
};
export declare class AttachmentCodec implements ContentCodec<Attachment> {
    get contentType(): ContentTypeId;
    encode(content: Attachment, registry: CodecRegistry): EncodedContent;
    decode(content: EncodedContent, registry: CodecRegistry): Attachment;
}
