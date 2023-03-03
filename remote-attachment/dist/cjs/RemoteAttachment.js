"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteAttachmentCodec = exports.ContentTypeRemoteAttachment = void 0;
const xmtp_js_1 = require("@xmtp/xmtp-js");
const secp = __importStar(require("@noble/secp256k1"));
const encryption_1 = require("./encryption");
const proto_1 = require("@xmtp/proto");
exports.ContentTypeRemoteAttachment = new xmtp_js_1.ContentTypeId({
    authorityId: 'xmtp.org',
    typeId: 'remoteStaticAttachment',
    versionMajor: 1,
    versionMinor: 0
});
class RemoteAttachmentCodec {
    static load(remoteAttachment, codecRegistry) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(remoteAttachment.url);
            const payload = new Uint8Array(yield response.arrayBuffer());
            if (!payload) {
                throw 'no payload for remote attachment at ' + remoteAttachment.url;
            }
            console.log(`load payload`, payload);
            const digestBytes = new Uint8Array(yield encryption_1.crypto.subtle.digest('SHA-256', payload));
            const digest = secp.utils.bytesToHex(digestBytes);
            console.log(`digest: ${digest}`);
            console.log(`contentDigest: ${remoteAttachment.contentDigest}`);
            if (digest !== remoteAttachment.contentDigest) {
                throw new Error('content digest does not match');
            }
            const ciphertext = new xmtp_js_1.Ciphertext({
                aes256GcmHkdfSha256: {
                    hkdfSalt: remoteAttachment.salt,
                    gcmNonce: remoteAttachment.nonce,
                    payload: payload
                }
            });
            const encodedContentData = yield (0, xmtp_js_1.decrypt)(ciphertext, remoteAttachment.secret);
            const encodedContent = proto_1.content.EncodedContent.decode(encodedContentData);
            if (!encodedContent || !encodedContent.type) {
                throw 'no encoded content';
            }
            const contentType = encodedContent.type;
            if (!contentType) {
                throw 'no content type';
            }
            const codec = codecRegistry.codecFor(new xmtp_js_1.ContentTypeId(contentType));
            if (!codec) {
                throw 'no codec found for ' + ((_a = encodedContent.type) === null || _a === void 0 ? void 0 : _a.typeId);
            }
            return codec.decode(encodedContent, codecRegistry);
        });
    }
    static encodeEncrypted(content, codec) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const secret = encryption_1.crypto.getRandomValues(new Uint8Array(32));
            const encodedContent = proto_1.content.EncodedContent.encode(codec.encode(content, {
                codecFor(contentType) { return undefined; }
            })).finish();
            const ciphertext = yield (0, xmtp_js_1.encrypt)(encodedContent, secret);
            const salt = (_a = ciphertext.aes256GcmHkdfSha256) === null || _a === void 0 ? void 0 : _a.hkdfSalt;
            const nonce = (_b = ciphertext.aes256GcmHkdfSha256) === null || _b === void 0 ? void 0 : _b.gcmNonce;
            const payload = (_c = ciphertext.aes256GcmHkdfSha256) === null || _c === void 0 ? void 0 : _c.payload;
            if (!salt || !nonce || !payload) {
                throw 'missing encryption key';
            }
            console.log(`encode payload`, payload);
            const digestBytes = new Uint8Array(yield encryption_1.crypto.subtle.digest('SHA-256', payload));
            const digest = secp.utils.bytesToHex(digestBytes);
            return {
                digest,
                secret,
                salt,
                nonce,
                payload,
            };
        });
    }
    get contentType() {
        return exports.ContentTypeRemoteAttachment;
    }
    encode(content, registry) {
        if (!content.url.startsWith('https')) {
            throw new Error('scheme must be https');
        }
        return {
            type: exports.ContentTypeRemoteAttachment,
            parameters: {
                contentDigest: content.contentDigest,
                salt: secp.utils.bytesToHex(content.salt),
                nonce: secp.utils.bytesToHex(content.nonce),
                secret: secp.utils.bytesToHex(content.secret),
                scheme: content.scheme,
                contentLength: String(content.contentLength),
                filename: content.filename
            },
            content: new TextEncoder().encode(content.url)
        };
    }
    decode(content, registry) {
        return {
            url: new TextDecoder().decode(content.content),
            contentDigest: content.parameters.contentDigest,
            salt: secp.utils.hexToBytes(content.parameters.salt),
            nonce: secp.utils.hexToBytes(content.parameters.nonce),
            secret: secp.utils.hexToBytes(content.parameters.secret),
            scheme: content.parameters.scheme,
            contentLength: parseInt(content.parameters.contentLength),
            filename: content.parameters.filename
        };
    }
}
exports.RemoteAttachmentCodec = RemoteAttachmentCodec;
//# sourceMappingURL=RemoteAttachment.js.map