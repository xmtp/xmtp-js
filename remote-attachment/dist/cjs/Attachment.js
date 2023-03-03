"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentCodec = exports.ContentTypeAttachment = void 0;
const xmtp_js_1 = require("@xmtp/xmtp-js");
exports.ContentTypeAttachment = new xmtp_js_1.ContentTypeId({
    authorityId: 'xmtp.org',
    typeId: 'attachment',
    versionMajor: 1,
    versionMinor: 0
});
class AttachmentCodec {
    get contentType() {
        return exports.ContentTypeAttachment;
    }
    encode(content, registry) {
        return {
            type: exports.ContentTypeAttachment,
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
exports.AttachmentCodec = AttachmentCodec;
//# sourceMappingURL=Attachment.js.map