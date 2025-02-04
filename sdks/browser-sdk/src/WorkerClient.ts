import {
  verifySignedWithPublicKey,
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

  get installationIdBytes() {
    return this.#client.installationIdBytes;
  }

  get isRegistered() {
    return this.#client.isRegistered;
  }

  createInboxSignatureText() {
    try {
      return this.#client.createInboxSignatureText();
    } catch {
      return undefined;
    }
  }

  async addAccountSignatureText(accountAddress: string) {
    try {
      return await this.#client.addWalletSignatureText(accountAddress);
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

  async revokeAllAOtherInstallationsSignatureText() {
    try {
      return await this.#client.revokeAllOtherInstallationsSignatureText();
    } catch {
      return undefined;
    }
  }

  async revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    try {
      return await this.#client.revokeInstallationsSignatureText(
        installationIds,
      );
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

  signWithInstallationKey(signatureText: string) {
    return this.#client.signWithInstallationKey(signatureText);
  }

  verifySignedWithInstallationKey(
    signatureText: string,
    signatureBytes: Uint8Array,
  ) {
    try {
      this.#client.verifySignedWithInstallationKey(
        signatureText,
        signatureBytes,
      );
      return true;
    } catch {
      return false;
    }
  }

  verifySignedWithPublicKey(
    signatureText: string,
    signatureBytes: Uint8Array,
    publicKey: Uint8Array,
  ) {
    try {
      verifySignedWithPublicKey(signatureText, signatureBytes, publicKey);
      return true;
    } catch {
      return false;
    }
  }
}
