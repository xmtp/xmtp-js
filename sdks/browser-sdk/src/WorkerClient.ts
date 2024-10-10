/* eslint-disable no-console */
import type { WasmClient } from "@xmtp/client-bindings-wasm";
import { WasmSignatureRequestType } from "@xmtp/client-bindings-wasm";
import type { ClientOptions } from "@/types";
import { createClient } from "@/utils/createClient";
import { WorkerConversations } from "@/WorkerConversations";

export class WorkerClient {
  #client: WasmClient;

  #conversations: WorkerConversations;

  accountAddress: string;

  constructor(client: WasmClient) {
    this.#client = client;
    this.accountAddress = client.accountAddress;
    this.#conversations = new WorkerConversations(this, client.conversations());
  }

  static async create(
    accountAddress: string,
    options?: Omit<ClientOptions, "codecs">,
  ) {
    const client = await createClient(accountAddress, options);
    return new WorkerClient(client);
  }

  get inboxId() {
    return this.#client.inboxId;
  }

  get installationId() {
    return this.#client.installationId;
  }

  get isRegistered() {
    return this.#client.isRegistered;
  }

  get conversations() {
    return this.#conversations;
  }

  async getSignatureText() {
    return this.#client.createInboxSignatureText();
  }

  async addSignature(bytes: Uint8Array) {
    return this.#client.addSignature(
      WasmSignatureRequestType.CreateInbox,
      bytes,
    );
  }

  async canMessage(accountAddresses: string[]) {
    return this.#client.canMessage(accountAddresses) as Promise<
      Map<string, boolean>
    >;
  }

  async registerIdentity() {
    return this.#client.registerIdentity();
  }

  async getInboxIdByAddress(accountAddress: string) {
    return this.#client.findInboxIdByAddress(accountAddress);
  }
}
