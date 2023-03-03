import { ContentTypeId } from "@xmtp/xmtp-js";
export const ContentTypeAttachment = new ContentTypeId({
    authorityId: 'xmtp.org',
    typeId: 'attachment',
    versionMajor: 1,
    versionMinor: 0
});
export class AttachmentCodec {
    get contentType() {
        return ContentTypeAttachment;
    }
    encode(content, registry) {
        return {
            type: ContentTypeAttachment,
            parameters: {
                filename: content.filename,
                mimeType: content.mimeType
            },
            content: content.data
        };
    }
    decode(content, registry) {
        return {
            filename: content.parameters.filename,
            mimeType: content.parameters.mimeType,
            data: content.content
        };
    }
}
//# sourceMappingURL=Attachment.js.map