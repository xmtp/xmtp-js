import {
  WasmSignatureRequestType,
  type WasmClient,
  type WasmConsentEntityType,
} from "@xmtp/client-bindings-wasm";
import type { ClientOptions } from "@/types";
import type { SafeConsent } from "@/utils/conversions";
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

  async findInboxIdByAddress(address: string) {
    return this.#client.findInboxIdByAddress(address);
  }

  async inboxState(refreshFromNetwork: boolean) {
    return this.#client.inboxState(refreshFromNetwork);
  }

  async getLatestInboxState(inboxId: string) {
    return this.#client.getLatestInboxState(inboxId);
  }

  async setConsentStates(records: SafeConsent[]) {
    return this.#client.setConsentStates(records);
  }

  async getConsentState(entityType: WasmConsentEntityType, entity: string) {
    return this.#client.getConsentState(entityType, entity);
  }
}
