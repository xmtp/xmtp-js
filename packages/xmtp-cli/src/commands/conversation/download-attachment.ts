import { writeFile as fsWriteFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cwd } from "node:process";
import { Args, Flags } from "@oclif/core";
import {
  decryptAttachment,
  type Attachment,
  type RemoteAttachment,
} from "@xmtp/node-sdk";
import { BaseCommand } from "../../baseCommand.js";
import { getExtension } from "../../utils/mime.js";

export default class ConversationDownloadAttachment extends BaseCommand {
  static description = `Download an attachment from a message.

Downloads an attachment message and saves it to disk. Handles both
inline attachments and remote (encrypted) attachments transparently.

For inline attachments, the content is written directly to disk.

For remote attachments, the encrypted payload is fetched from the URL
embedded in the message, decrypted using the keys in the message, and
the decrypted content is saved to disk.

The output filename is determined by (in order of priority):
1. The --output flag (explicit path)
2. The filename from the message metadata
3. Auto-generated from message ID + MIME type extension

Use --raw to save the encrypted payload without decrypting (remote
attachments only).`;

  static examples = [
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <message-id>",
      description: "Download attachment (auto-names from message metadata)",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <message-id> --output ./photo.jpg",
      description: "Download to a specific path",
    },
    {
      command:
        "<%= config.bin %> <%= command.id %> <conversation-id> <message-id> --raw",
      description:
        "Save the encrypted payload without decrypting (remote only)",
    },
  ];

  static args = {
    id: Args.string({
      description: "The conversation ID",
      required: true,
    }),
    "message-id": Args.string({
      description: "The message ID of the attachment",
      required: true,
    }),
  };

  static flags = {
    ...BaseCommand.baseFlags,
    output: Flags.string({
      char: "o",
      description: "Output file path (default: auto-generated from metadata)",
      helpValue: "<path>",
    }),
    raw: Flags.boolean({
      description:
        "Save encrypted payload without decrypting (remote attachments only)",
      default: false,
    }),
    sync: Flags.boolean({
      description: "Sync conversation from network before downloading",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConversationDownloadAttachment);
    const client = await this.initClient();

    const conversation = await client.conversations.getConversationById(
      args.id,
    );

    if (!conversation) {
      this.error(`Conversation not found: ${args.id}`);
    }

    if (flags.sync) {
      await conversation.sync();
    }

    const message = client.conversations.getMessageById(args["message-id"]);

    if (!message) {
      this.error(
        `Message not found: ${args["message-id"]}. Try --sync to fetch latest messages.`,
      );
    }

    const typeId = message.contentType.typeId;

    if (typeId === "attachment") {
      await this.downloadInline(
        message.content as Attachment,
        args["message-id"],
        flags,
      );
    } else if (typeId === "remoteStaticAttachment") {
      await this.downloadRemote(
        message.content as RemoteAttachment,
        args["message-id"],
        flags,
      );
    } else {
      this.error(
        `Message ${args["message-id"]} is not an attachment (type: ${typeId})`,
      );
    }
  }

  private async downloadInline(
    attachment: Attachment,
    messageId: string,
    flags: { output?: string },
  ): Promise<void> {
    const bytes = attachment.content;
    const mimeType = attachment.mimeType;
    const filename =
      flags.output ??
      attachment.filename ??
      `${messageId.slice(0, 16)}${getExtension(mimeType)}`;
    const outputPath = isAbsolute(filename) ? filename : join(cwd(), filename);

    await writeFileWithDirs(outputPath, bytes);

    this.output({
      success: true,
      type: "inline",
      outputPath,
      filename: attachment.filename,
      mimeType,
      size: bytes.length,
    });
  }

  private async downloadRemote(
    remote: RemoteAttachment,
    messageId: string,
    flags: { output?: string; raw: boolean },
  ): Promise<void> {
    // Fetch the encrypted payload
    const response = await fetch(remote.url);

    if (!response.ok) {
      this.error(
        `Failed to fetch remote attachment: ${response.status} ${response.statusText} (${remote.url})`,
      );
    }

    const encryptedBytes = new Uint8Array(await response.arrayBuffer());

    if (flags.raw) {
      // Save encrypted payload without decrypting
      const filename =
        flags.output ??
        `${remote.filename ?? messageId.slice(0, 16)}.encrypted`;
      const outputPath = isAbsolute(filename)
        ? filename
        : join(cwd(), filename);

      await writeFileWithDirs(outputPath, encryptedBytes);

      this.output({
        success: true,
        type: "remote-raw",
        outputPath,
        url: remote.url,
        size: encryptedBytes.length,
      });
      return;
    }

    // Decrypt the payload
    const decrypted = decryptAttachment(encryptedBytes, remote);

    const mimeType = decrypted.mimeType;
    const filename =
      flags.output ??
      decrypted.filename ??
      remote.filename ??
      `${messageId.slice(0, 16)}${getExtension(mimeType)}`;
    const outputPath = isAbsolute(filename) ? filename : join(cwd(), filename);

    await writeFileWithDirs(outputPath, decrypted.content);

    this.output({
      success: true,
      type: "remote",
      outputPath,
      filename: decrypted.filename ?? remote.filename,
      mimeType,
      size: decrypted.content.length,
      url: remote.url,
    });
  }
}

function isAbsolute(p: string): boolean {
  return p.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(p);
}

async function writeFileWithDirs(
  path: string,
  data: Uint8Array,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await fsWriteFile(path, data);
}
