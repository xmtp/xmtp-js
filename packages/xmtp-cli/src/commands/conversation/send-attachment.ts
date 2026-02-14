import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { Args, Flags } from "@oclif/core";
import { encryptAttachment } from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { createClient } from "../../utils/client.js";
import { getMimeType } from "../../utils/mime.js";
import {
  getUploadProvider,
  INLINE_ATTACHMENT_MAX_BYTES,
} from "../../utils/upload.js";

export default class ConversationSendAttachment extends BaseCommand {
  static description = `Send a file attachment to a conversation.

Reads a file from disk and sends it as an attachment message. Small
files are sent inline; large files (>1MB) are automatically encrypted
and uploaded via the configured upload provider, then sent as a remote
attachment.

To configure an upload provider for large files:

  Set XMTP_UPLOAD_PROVIDER and XMTP_UPLOAD_PROVIDER_TOKEN in your .env,
  or pass --upload-provider and --upload-provider-token flags.

  Supported providers: pinata

  Example (.env):
    XMTP_UPLOAD_PROVIDER=pinata
    XMTP_UPLOAD_PROVIDER_TOKEN=<your-pinata-jwt>
    XMTP_UPLOAD_PROVIDER_GATEWAY=https://your-gateway.mypinata.cloud

The MIME type is auto-detected from the file extension, or can be
specified manually with --mime-type.

Use --encrypt to only encrypt the file and output decryption keys
without sending (for manual upload workflows).`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> ./photo.jpg",
      description: "Send a photo (auto-detects inline vs remote)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> ./document.pdf --mime-type application/pdf",
      description: "Send with explicit MIME type",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> ./photo.jpg --encrypt",
      description:
        "Encrypt and output remote attachment info (for manual upload)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> ./large-video.mp4 --upload-provider pinata --upload-provider-token <jwt>",
      description: "Send a large file via Pinata",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    file: Args.string({
      description: "Path to the file to send",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    "mime-type": Flags.string({
      description: "Override the auto-detected MIME type",
      helpValue: "<type>",
    }),
    optimistic: Flags.boolean({
      description:
        "Send optimistically (queued locally and published via 'conversation publish-messages')",
      default: false,
    }),
    encrypt: Flags.boolean({
      description:
        "Encrypt the attachment and output the encrypted payload and decryption keys instead of sending. Upload the payload yourself, then use 'send-remote-attachment' to send the message.",
      default: false,
    }),
    "encrypted-output": Flags.string({
      description:
        "When using --encrypt, write the encrypted payload to this file path (default: <file>.encrypted)",
      helpValue: "<path>",
      dependsOn: ["encrypt"],
    }),
    "upload-provider": Flags.string({
      description: "Upload provider for remote attachments",
      helpValue: "<provider>",
    }),
    "upload-provider-token": Flags.string({
      description: "Authentication token for the upload provider",
      helpValue: "<token>",
    }),
    "upload-provider-gateway": Flags.string({
      description: "Custom gateway URL for the upload provider",
      helpValue: "<url>",
    }),
    remote: Flags.boolean({
      description:
        "Force sending as a remote attachment (encrypt + upload), even for small files",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationSendAttachment);

    // Merge upload-specific flags with base config (CLI flags take precedence)
    const config = {
      ...this.getConfig(),
      ...(flags["upload-provider"] && {
        uploadProvider: flags["upload-provider"],
      }),
      ...(flags["upload-provider-token"] && {
        uploadProviderToken: flags["upload-provider-token"],
      }),
      ...(flags["upload-provider-gateway"] && {
        uploadProviderGateway: flags["upload-provider-gateway"],
      }),
    };

    const content = await readFile(args.file);
    const filename = basename(args.file);
    const mimeType = flags["mime-type"] ?? getMimeType(args.file);

    const attachment = {
      mimeType,
      content,
      filename,
    };

    // --encrypt: just encrypt and output keys, don't send
    if (flags.encrypt) {
      const encrypted = encryptAttachment(attachment);
      const outputPath = flags["encrypted-output"] ?? `${args.file}.encrypted`;
      await writeFile(outputPath, encrypted.payload);

      this.output({
        encryptedFile: outputPath,
        filename,
        mimeType,
        contentDigest: encrypted.contentDigest,
        secret: Buffer.from(encrypted.secret).toString("base64"),
        salt: Buffer.from(encrypted.salt).toString("base64"),
        nonce: Buffer.from(encrypted.nonce).toString("base64"),
        contentLength: encrypted.payload.length,
        note: "Upload the encrypted file to a URL, then use 'conversation send-remote-attachment' to send it.",
      });
      return;
    }

    const client = await createClient(config);
    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    const needsRemote =
      flags.remote || content.length > INLINE_ATTACHMENT_MAX_BYTES;

    if (needsRemote) {
      // Encrypt + upload + send as remote attachment
      const provider = getUploadProvider(config);

      if (!provider) {
        this.error(
          `File is ${content.length} bytes (>${INLINE_ATTACHMENT_MAX_BYTES}). ` +
            `Configure an upload provider to send large files.\n\n` +
            `Set in your .env:\n` +
            `  XMTP_UPLOAD_PROVIDER=pinata\n` +
            `  XMTP_UPLOAD_PROVIDER_TOKEN=<your-jwt>\n\n` +
            `Or use flags:\n` +
            `  --upload-provider pinata --upload-provider-token <jwt>\n\n` +
            `Or use --encrypt to manually encrypt and upload.`,
        );
      }

      const encrypted = encryptAttachment(attachment);
      const url = await provider.upload(encrypted.payload, filename, mimeType);

      const messageId = await conversation.sendRemoteAttachment(
        {
          url,
          contentDigest: encrypted.contentDigest,
          secret: encrypted.secret,
          salt: encrypted.salt,
          nonce: encrypted.nonce,
          scheme: "https",
          contentLength: encrypted.payload.length,
          filename,
        },
        flags.optimistic,
      );

      this.output({
        success: true,
        messageId,
        conversationId: args.id,
        filename,
        mimeType,
        size: content.length,
        type: "remote",
        provider: provider.name,
        url,
        optimistic: flags.optimistic,
      });
    } else {
      // Send inline
      const messageId = await conversation.sendAttachment(
        attachment,
        flags.optimistic,
      );

      this.output({
        success: true,
        messageId,
        conversationId: args.id,
        filename,
        mimeType,
        size: content.length,
        type: "inline",
        optimistic: flags.optimistic,
      });
    }
  }
}
