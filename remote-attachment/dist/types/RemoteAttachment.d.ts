import { ContentCodec, ContentTypeId, EncodedContent } from "@xmtp/xmtp-js";
import { CodecRegistry } from "@xmtp/xmtp-js/dist/types/src/MessageContent";
export declare const ContentTypeRemoteAttachment: ContentTypeId;
export type EncryptedEncodedContent = {
    digest: string;
    salt: Uint8Array;
    nonce: Uint8Array;
    secret: Uint8Array;
    payload: Uint8Array;
};
export type RemoteAttachment = {
    url: string;
    contentDigest: string;
    salt: Uint8Array;
    nonce: Uint8Array;
    secret: Uint8Array;
    scheme: string;
    contentLength: number;
    filename: string;
};
export declare class RemoteAttachmentCodec implements ContentCodec<RemoteAttachment> {
    static load<T>(remoteAttachment: RemoteAttachment, codecRegistry: CodecRegistry): Promise<T>;
    static encodeEncrypted<T>(content: T, codec: ContentCodec<T>): Promise<EncryptedEncodedContent>;
    get contentType(): ContentTypeId;
    encode(content: RemoteAttachment, registry: CodecRegistry): EncodedContent;
    decode(content: EncodedContent, registry: CodecRegistry): RemoteAttachment;
}
