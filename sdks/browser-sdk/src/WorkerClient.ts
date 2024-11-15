import {
  type Client,
  type ConsentEntityType,
  type SignatureRequestType,
} from "@xmtp/wasm-bindings";
import type { ClientOptions } from "@/types";
import { fromSafeConsent, type SafeConsent } from "@/utils/conversions";
import { createClient } from "@/utils/createClient";
import { WorkerConversations } from "@/WorkerConversations";

export class WorkerClient {
  #client: Client;

  #conversations: WorkerConversations;

  #accountAddress: string;

  constructor(client: Client) {
    this.#client = client;
    this.#accountAddress = client.accountAddress;
    this.#conversations = new WorkerConversations(this, client.conversations());
  }

  static async create(
    accountAddress: string,
    encryptionKey: Uint8Array,
    options?: Omit<ClientOptions, "codecs">,
  ) {
    const client = await createClient(accountAddress, encryptionKey, options);
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

  async createInboxSignatureText() {
    try {
      return await this.#client.createInboxSignatureText();
    } catch {
      return undefined;
    }
  }

  async addAccountSignatureText(accountAddress: string) {
    try {
      return await this.#client.addWalletSignatureText(
        this.#accountAddress,
        accountAddress,
      );
    } catch {
      return undefined;
    }
  }

  async removeAccountSignatureText(accountAddress: string) {
    try {
      return await this.#client.revokeWalletSignatureText(accountAddress);
    } catch {
      return undefined;
    }
  }

  async revokeInstallationsSignatureText() {
    try {
      return await this.#client.revokeInstallationsSignatureText();
    } catch {
      return undefined;
    }
  }

  async addSignature(type: SignatureRequestType, bytes: Uint8Array) {
    return this.#client.addSignature(type, bytes);
  }

  async addScwSignature(
    type: SignatureRequestType,
    bytes: Uint8Array,
    chainId: bigint,
    blockNumber?: bigint,
  ) {
    return this.#client.addScwSignature(type, bytes, chainId, blockNumber);
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

  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#client.getConsentState(entityType, entity);
  }

  get conversations() {
    return this.#conversations;
  }
}
