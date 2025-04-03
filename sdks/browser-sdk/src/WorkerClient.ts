import {
  verifySignedWithPublicKey,
  type Client,
  type Identifier,
  type KeyPackageStatus,
  type SignatureRequestType,
} from "@xmtp/wasm-bindings";
import type { ClientOptions } from "@/types";
import { createClient } from "@/utils/createClient";
import { WorkerConversations } from "@/WorkerConversations";
import { WorkerPreferences } from "@/WorkerPreferences";

export class WorkerClient {
  #client: Client;
  #conversations: WorkerConversations;
  #preferences: WorkerPreferences;

  constructor(client: Client) {
    this.#client = client;
    const conversations = client.conversations();
    this.#conversations = new WorkerConversations(this, conversations);
    this.#preferences = new WorkerPreferences(client, conversations);
  }

  static async create(
    identifier: Identifier,
    options?: Omit<ClientOptions, "codecs">,
  ) {
    const client = await createClient(identifier, options);
    return new WorkerClient(client);
  }

  get accountIdentifier() {
    return this.#client.accountIdentifier;
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

  get conversations() {
    return this.#conversations;
  }

  get preferences() {
    return this.#preferences;
  }

  createInboxSignatureText() {
    try {
      return this.#client.createInboxSignatureText();
    } catch {
      return undefined;
    }
  }

  async addAccountSignatureText(identifier: Identifier) {
    try {
      return await this.#client.addWalletSignatureText(identifier);
    } catch {
      return undefined;
    }
  }

  async removeAccountSignatureText(identifier: Identifier) {
    try {
      return await this.#client.revokeWalletSignatureText(identifier);
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

  async changeRecoveryIdentifierSignatureText(identifier: Identifier) {
    try {
      return await this.#client.changeRecoveryIdentifierSignatureText(
        identifier,
      );
    } catch {
      return undefined;
    }
  }

  async addEcdsaSignature(type: SignatureRequestType, bytes: Uint8Array) {
    return this.#client.addEcdsaSignature(type, bytes);
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

  async canMessage(identifiers: Identifier[]) {
    return this.#client.canMessage(identifiers) as Promise<
      Map<string, boolean>
    >;
  }

  async registerIdentity() {
    return this.#client.registerIdentity();
  }

  async findInboxIdByIdentifier(identifier: Identifier) {
    return this.#client.findInboxIdByIdentifier(identifier);
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

  async getKeyPackageStatusesForInstallationIds(installationIds: string[]) {
    return this.#client.getKeyPackageStatusesForInstallationIds(
      installationIds,
    ) as Promise<Map<string, KeyPackageStatus>>;
  }
}
