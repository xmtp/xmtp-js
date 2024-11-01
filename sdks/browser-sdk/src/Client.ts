import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@xmtp/content-type-group-updated";
import type {
  ContentCodec,
  ContentTypeId,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import {
  WasmGroupMessageKind,
  type WasmConsentEntityType,
  type WasmSignatureRequestType,
} from "@xmtp/wasm-bindings";
import { ClientWorkerClass } from "@/ClientWorkerClass";
import { Conversations } from "@/Conversations";
import type { ClientOptions } from "@/types";
import {
  fromSafeEncodedContent,
  toSafeEncodedContent,
  type SafeConsent,
  type SafeMessage,
} from "@/utils/conversions";

export class Client extends ClientWorkerClass {
  address: string;

  options?: ClientOptions;

  #isReady = false;

  #inboxId: string | undefined;

  #installationId: string | undefined;

  #conversations: Conversations;

  #codecs: Map<string, ContentCodec>;

  constructor(address: string, options?: ClientOptions) {
    const worker = new Worker(new URL("./workers/client", import.meta.url), {
      type: "module",
    });
    super(worker, options?.enableLogging ?? false);
    this.address = address;
    this.options = options;
    this.#conversations = new Conversations(this);
    const codecs = [
      new GroupUpdatedCodec(),
      new TextCodec(),
      ...(options?.codecs ?? []),
    ];
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  async init() {
    const result = await this.sendMessage("init", {
      address: this.address,
      options: this.options,
    });
    this.#inboxId = result.inboxId;
    this.#installationId = result.installationId;
    this.#isReady = true;
  }

  static async create(address: string, options?: ClientOptions) {
    const client = new Client(address, options);
    await client.init();
    return client;
  }

  get isReady() {
    return this.#isReady;
  }

  get inboxId() {
    return this.#inboxId;
  }

  get installationId() {
    return this.#installationId;
  }

  async getCreateInboxSignatureText() {
    return this.sendMessage("getCreateInboxSignatureText", undefined);
  }

  async getAddWalletSignatureText(accountAddress: string) {
    return this.sendMessage("getAddWalletSignatureText", { accountAddress });
  }

  async getRevokeWalletSignatureText(accountAddress: string) {
    return this.sendMessage("getRevokeWalletSignatureText", { accountAddress });
  }

  async getRevokeInstallationsSignatureText() {
    return this.sendMessage("getRevokeInstallationsSignatureText", undefined);
  }

  async addSignature(type: WasmSignatureRequestType, bytes: Uint8Array) {
    return this.sendMessage("addSignature", { type, bytes });
  }

  async applySignatures() {
    return this.sendMessage("applySignatures", undefined);
  }

  async registerIdentity() {
    return this.sendMessage("registerIdentity", undefined);
  }

  async isRegistered() {
    return this.sendMessage("isRegistered", undefined);
  }

  async canMessage(accountAddresses: string[]) {
    return this.sendMessage("canMessage", { accountAddresses });
  }

  async findInboxIdByAddress(address: string) {
    return this.sendMessage("findInboxIdByAddress", { address });
  }

  async inboxState(refreshFromNetwork?: boolean) {
    return this.sendMessage("inboxState", {
      refreshFromNetwork: refreshFromNetwork ?? false,
    });
  }

  async getLatestInboxState(inboxId: string) {
    return this.sendMessage("getLatestInboxState", { inboxId });
  }

  async setConsentStates(records: SafeConsent[]) {
    return this.sendMessage("setConsentStates", { records });
  }

  async getConsentState(entityType: WasmConsentEntityType, entity: string) {
    return this.sendMessage("getConsentState", { entityType, entity });
  }

  get conversations() {
    return this.#conversations;
  }

  codecFor(contentType: ContentTypeId) {
    return this.#codecs.get(contentType.toString());
  }

  encodeContent(content: any, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(
        `Codec not found for "${contentType.toString()}" content type`,
      );
    }
    const encoded = codec.encode(content, this);
    const fallback = codec.fallback(content);
    if (fallback) {
      encoded.fallback = fallback;
    }
    return toSafeEncodedContent(encoded);
  }

  decodeContent(message: SafeMessage, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(
        `Codec not found for "${contentType.toString()}" content type`,
      );
    }

    // throw an error if there's an invalid group membership change message
    if (
      contentType.sameAs(ContentTypeGroupUpdated) &&
      message.kind !== WasmGroupMessageKind.MembershipChange
    ) {
      throw new Error("Error decoding group membership change");
    }

    const encodedContent = fromSafeEncodedContent(message.content);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return codec.decode(encodedContent, this);
  }
}
