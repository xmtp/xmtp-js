import { Agent } from "@xmtp/agent-sdk";
import { MarkdownCodec } from "@xmtp/content-type-markdown";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { WalletSendCallsCodec } from "@xmtp/content-type-wallet-send-calls";

let cachedAgent: Agent | null = null;

export async function getAgent(): Promise<Agent> {
  if (!cachedAgent) {
    cachedAgent = await Agent.createFromEnv({
      codecs: [
        new MarkdownCodec(),
        new ReactionCodec(),
        new ReplyCodec(),
        new RemoteAttachmentCodec(),
        new AttachmentCodec(),
        new WalletSendCallsCodec(),
      ],
    });
  }
  return cachedAgent;
}
