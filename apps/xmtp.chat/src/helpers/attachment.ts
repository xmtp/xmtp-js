import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: "",
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
];

export type FileValidation =
  | {
      valid: true;
    }
  | {
      valid: false;
      error: string;
    };

export const validateFile = (file: File): FileValidation => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size must not be greater than 1MB",
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "File type not supported. Please select an image, video, or audio file.",
    };
  }

  return { valid: true };
};

export const getPresignedUrl = async (): Promise<string> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_SERVICE_URL}/api/v1/pinata/presigned-url`,
    {
      method: "GET",
    },
  );
  const data = (await response.json()) as { url: string };
  return data.url;
};

export const uploadAttachment = async (
  file: File,
): Promise<RemoteAttachment> => {
  // Convert file to array buffer for encryption
  const arrayBuffer = await file.arrayBuffer();
  const attachment = new Uint8Array(arrayBuffer);

  // Use RemoteAttachmentCodec to encrypt the attachment
  const attachmentData: Attachment = {
    mimeType: file.type,
    filename: file.name,
    data: attachment,
  };

  const encryptedAttachment = await RemoteAttachmentCodec.encodeEncrypted(
    attachmentData,
    new AttachmentCodec(),
  );

  // Upload the encrypted payload to Pinata
  const encryptedBlob = new Blob(
    [encryptedAttachment.payload as Uint8Array<ArrayBuffer>],
    {
      type: "application/octet-stream",
    },
  );
  const encryptedFile = new File([encryptedBlob], file.name, {
    type: "application/octet-stream",
  });

  const presignedUrl = await getPresignedUrl();
  const upload = await pinata.upload.public
    .file(encryptedFile)
    .url(presignedUrl);
  const url = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${upload.cid}`;

  // Return the RemoteAttachment with encryption metadata
  return {
    url,
    contentDigest: encryptedAttachment.digest,
    salt: encryptedAttachment.salt,
    nonce: encryptedAttachment.nonce,
    secret: encryptedAttachment.secret,
    scheme: "https://",
    contentLength: file.size,
    filename: file.name,
  };
};

export const getFileType = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return "image";
    case "mp4":
    case "webm":
    case "mov":
      return "video";
    case "mp3":
    case "wav":
    case "ogg":
      return "audio";
    default:
      return "file";
  }
};

export const formatFileSize = (fileSize: number) => {
  if (!fileSize) return "";
  const kb = fileSize / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};
