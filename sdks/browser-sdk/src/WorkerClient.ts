import {
  type WasmClient,
  type WasmConsentEntityType,
  type WasmSignatureRequestType,
} from "@xmtp/wasm-bindings";
import type { ClientOptions } from "@/types";
import { fromSafeConsent, type SafeConsent } from "@/utils/conversions";
import { createClient } from "@/utils/createClient";
import { WorkerConversations } from "@/WorkerConversations";

export class WorkerClient {
  #client: WasmClient;

  #conversations: WorkerConversations;

  #accountAddress: string;

  constructor(client: WasmClient) {
    this.#client = client;
    this.#accountAddress = client.accountAddress;
    this.#conversations = new WorkerConversations(this, client.conversations());
  }

  static async create(
    accountAddress: string,
    options?: Omit<ClientOptions, "codecs">,
  ) {
    const client = await createClient(accountAddress, options);
    return new WorkerClient(client);
  }

  get accountAddress() {
    return this.#accountAddress;
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

  async getCreateInboxSignatureText() {
    try {
      return await this.#client.createInboxSignatureText();
    } catch {
      return undefined;
    }
  }

  async getAddWalletSignatureText(accountAddress: string) {
    try {
      return await this.#client.addWalletSignatureText(
        this.#accountAddress,
        accountAddress,
      );
    } catch {
      return undefined;
    }
  }

  async getRevokeWalletSignatureText(accountAddress: string) {
    try {
      return await this.#client.revokeWalletSignatureText(accountAddress);
    } catch {
      return undefined;
    }
  }

  async getRevokeInstallationsSignatureText() {
    try {
      return await this.#client.revokeInstallationsSignatureText();
    } catch {
      return undefined;
    }
  }

  async addSignature(type: WasmSignatureRequestType, bytes: Uint8Array) {
    return this.#client.addSignature(type, bytes);
  }

  async applySignatures() {
    return this.#client.applySignatureRequests();
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
    return this.#client.setConsentStates(records.map(fromSafeConsent));
  }

  async getConsentState(entityType: WasmConsentEntityType, entity: string) {
    return this.#client.getConsentState(entityType, entity);
  }

  get conversations() {
    return this.#conversations;
  }
}
