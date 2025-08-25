import {
  AttachmentCodec,
  RemoteAttachmentCodec,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: "gateway.pinata.cloud",
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
  "audio/webm",
  "audio/ogg",
];

export const validateFile = (
  file: File,
): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 5MB" };
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

export const uploadAttachment = async (
  file: File,
): Promise<RemoteAttachment> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
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
    const encryptedBlob = new Blob([encryptedAttachment.payload], {
      type: "application/octet-stream",
    });
    const encryptedFile = new File([encryptedBlob], file.name, {
      type: "application/octet-stream",
    });

    const upload = await pinata.upload.public.file(encryptedFile);
    const url = `https://gateway.pinata.cloud/ipfs/${upload.cid}`;

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
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw new Error("Failed to upload attachment");
  }
};
