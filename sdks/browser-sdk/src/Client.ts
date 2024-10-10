import type {
  ContentCodec,
  ContentTypeId,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import { WasmGroupMessageKind } from "@xmtp/client-bindings-wasm";
import { Conversations } from "@/Conversations";
import type { ClientOptions } from "@/types";
import { ClientWorkerClass } from "@/ClientWorkerClass";
import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@/codecs/GroupUpdatedCodec";
import type { SafeMessage } from "@/utils/conversions";
import {
  fromSafeEncodedContent,
  toSafeEncodedContent,
} from "@/utils/conversions";

export class Client extends ClientWorkerClass {
  address: string;

  options?: ClientOptions;

  #isReady = false;

  #inboxId: string | undefined;

  #installationId: string | undefined;

  #conversations: Conversations;

  #codecs: Map<string, ContentCodec<any>>;

  constructor(address: string, options?: ClientOptions) {
    const worker = new Worker(new URL("./workers/client", import.meta.url), {
      type: "module",
    });
    super(worker);
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

  async getSignatureText() {
    return this.sendMessage("getSignatureText", undefined);
  }

  async addSignature(bytes: Uint8Array) {
    return this.sendMessage("addSignature", { bytes });
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
