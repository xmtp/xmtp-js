import {
  verifySignedWithPublicKey,
  type Client,
  type Identifier,
  type KeyPackageStatus,
  type SignatureRequestHandle,
} from "@xmtp/wasm-bindings";
import type { ClientOptions } from "@/types/options";
import { createClient } from "@/utils/createClient";
import type { SafeSigner } from "@/utils/signer";
import { WorkerConversations } from "@/WorkerConversations";
import { WorkerDebugInformation } from "@/WorkerDebugInformation";
import { WorkerPreferences } from "@/WorkerPreferences";

export class WorkerClient {
  #client: Client;
  #conversations: WorkerConversations;
  #debugInformation: WorkerDebugInformation;
  #preferences: WorkerPreferences;

  constructor(client: Client, options?: ClientOptions) {
    this.#client = client;
    const conversations = client.conversations();
    this.#conversations = new WorkerConversations(this, conversations);
    this.#debugInformation = new WorkerDebugInformation(client, options);
    this.#preferences = new WorkerPreferences(client, conversations);
  }

  static async create(
    identifier: Identifier,
    options?: Omit<ClientOptions, "codecs">,
  ) {
    const client = await createClient(identifier, options);
    return new WorkerClient(client, options);
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

  get debugInformation() {
    return this.#debugInformation;
  }

  get preferences() {
    return this.#preferences;
  }

  async canMessage(identifiers: Identifier[]) {
    return this.#client.canMessage(identifiers) as Promise<
      Map<string, boolean>
    >;
  }

  async addSignature(
    signatureRequest: SignatureRequestHandle,
    signer: SafeSigner,
  ) {
    switch (signer.type) {
      case "SCW":
        await signatureRequest.addScwSignature(
          signer.identifier,
          signer.signature,
          signer.chainId,
          signer.blockNumber,
        );
        break;
      case "EOA":
        await signatureRequest.addEcdsaSignature(signer.signature);
        break;
    }
  }

  async applySignatureRequest(signatureRequest: SignatureRequestHandle) {
    return this.#client.applySignatureRequest(signatureRequest);
  }

  async processSignatureRequest(
    signer: SafeSigner,
    signatureRequest: SignatureRequestHandle,
  ) {
    await this.addSignature(signatureRequest, signer);
    await this.applySignatureRequest(signatureRequest);
  }

  createInboxSignatureRequest() {
    return this.#client.createInboxSignatureRequest();
  }

  async addAccountSignatureRequest(newAccountIdentifier: Identifier) {
    return this.#client.addWalletSignatureRequest(newAccountIdentifier);
  }

  async removeAccountSignatureRequest(identifier: Identifier) {
    return this.#client.revokeWalletSignatureRequest(identifier);
  }

  async revokeAllOtherInstallationsSignatureRequest() {
    return this.#client.revokeAllOtherInstallationsSignatureRequest();
  }

  async revokeInstallationsSignatureRequest(installationIds: Uint8Array[]) {
    return this.#client.revokeInstallationsSignatureRequest(installationIds);
  }

  async changeRecoveryIdentifierSignatureRequest(identifier: Identifier) {
    return this.#client.changeRecoveryIdentifierSignatureRequest(identifier);
  }

  async registerIdentity(
    signer: SafeSigner,
    signatureRequest: SignatureRequestHandle,
  ) {
    await this.addSignature(signatureRequest, signer);
    await this.#client.registerIdentity(signatureRequest);
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
