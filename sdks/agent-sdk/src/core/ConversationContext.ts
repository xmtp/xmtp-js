import { ContentTypeMarkdown } from "@xmtp/content-type-markdown";
import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { ContentTypeText } from "@xmtp/content-type-text";
import {
  ConsentState,
  type Client,
  type Conversation,
  type Dm,
  type Group,
} from "@xmtp/node-sdk";
import { filter } from "@/core/filter.js";
import {
  createRemoteAttachmentFromFile,
  type AttachmentUploadCallback,
} from "@/util/AttachmentUtil.js";
import { ClientContext } from "./ClientContext.js";

export class ConversationContext<
  ContentTypes = unknown,
  ConversationType extends Conversation = Conversation,
> extends ClientContext<ContentTypes> {
  #conversation: ConversationType;

  constructor({
    conversation,
    client,
  }: {
    conversation: ConversationType;
    client: Client<ContentTypes>;
  }) {
    super({ client });
    this.#conversation = conversation;
  }

  isDm(): this is ConversationContext<ContentTypes, Dm<ContentTypes>> {
    return filter.isDM(this.#conversation);
  }

  isGroup(): this is ConversationContext<ContentTypes, Group<ContentTypes>> {
    return filter.isGroup(this.#conversation);
  }

  // Send methods, which don't need a message context, are in ConversationContext to make them available in both dm and group event handlers
  async sendMarkdown(markdown: string): Promise<void> {
    await this.conversation.send(markdown, ContentTypeMarkdown);
  }

  async sendText(text: string): Promise<void> {
    await this.conversation.send(text, ContentTypeText);
  }

  async sendRemoteAttachment(
    unencryptedFile: File,
    uploadCallback: AttachmentUploadCallback,
  ): Promise<void> {
    const remoteAttachment = await createRemoteAttachmentFromFile(
      unencryptedFile,
      uploadCallback,
    );
    await this.conversation.send(remoteAttachment, ContentTypeRemoteAttachment);
  }

  get conversation() {
    return this.#conversation;
  }

  get isAllowed() {
    return this.#conversation.consentState === ConsentState.Allowed;
  }

  get isDenied() {
    return this.#conversation.consentState === ConsentState.Denied;
  }

  get isUnknown() {
    return this.#conversation.consentState === ConsentState.Unknown;
  }
}
