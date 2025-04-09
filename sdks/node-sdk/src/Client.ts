import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@xmtp/content-type-group-updated";
import type {
  ContentCodec,
  ContentTypeId,
  EncodedContent,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import {
  GroupMessageKind,
  isAddressAuthorized as isAddressAuthorizedBinding,
  isInstallationAuthorized as isInstallationAuthorizedBinding,
  SignatureRequestType,
  verifySignedWithPublicKey as verifySignedWithPublicKeyBinding,
  type Identifier,
  type Message,
  type Client as NodeClient,
} from "@xmtp/node-bindings";
import { ApiUrls } from "@/constants";
import { Conversations } from "@/Conversations";
import { Preferences } from "@/Preferences";
import type { ClientOptions, NetworkOptions, XmtpEnv } from "@/types";
import { createClient } from "@/utils/createClient";
import { getInboxIdForIdentifier } from "@/utils/inboxId";
import { type Signer } from "@/utils/signer";
import { version } from "@/utils/version";

export class Client {
  #innerClient: NodeClient;
  #conversations: Conversations;
  #preferences: Preferences;
  #signer: Signer;
  #codecs: Map<string, ContentCodec>;

  constructor(client: NodeClient, signer: Signer, codecs: ContentCodec[]) {
    this.#innerClient = client;
    const conversations = client.conversations();
    this.#conversations = new Conversations(this, conversations);
    this.#preferences = new Preferences(client, conversations);
    this.#signer = signer;
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  static async create(
    signer: Signer,
    encryptionKey: Uint8Array,
    options?: ClientOptions,
  ) {
    const identifier = await signer.getIdentifier();
    const client = await createClient(identifier, encryptionKey, options);

    const clientInstance = new Client(client, signer, [
      new GroupUpdatedCodec(),
      new TextCodec(),
      ...(options?.codecs ?? []),
    ]);

    if (!options?.disableAutoRegister) {
      await clientInstance.register();
    }

    return clientInstance;
  }

  get identifier() {
    return this.#innerClient.accountIdentifier;
  }

  get inboxId() {
    return this.#innerClient.inboxId();
  }

  get installationId() {
    return this.#innerClient.installationId();
  }

  get installationIdBytes() {
    return this.#innerClient.installationIdBytes();
  }

  get isRegistered() {
    return this.#innerClient.isRegistered();
  }

  get conversations() {
    return this.#conversations;
  }

  get preferences() {
    return this.#preferences;
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register` function instead.
   */
  async unsafe_createInboxSignatureText() {
    try {
      const signatureText = await this.#innerClient.createInboxSignatureText();
      return signatureText;
    } catch {
      return undefined;
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `unsafe_addAccount` function instead.
   *
   * The `allowInboxReassign` parameter must be true or this function will
   * throw an error.
   */
  async unsafe_addAccountSignatureText(
    newAccountIdentifier: Identifier,
    allowInboxReassign: boolean = false,
  ) {
    if (!allowInboxReassign) {
      throw new Error(
        "Unable to create add identifier signature text, `allowInboxReassign` must be true",
      );
    }

    try {
      const signatureText =
        await this.#innerClient.addIdentifierSignatureText(
          newAccountIdentifier,
        );
      return signatureText;
    } catch {
      return undefined;
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `removeAccount` function instead.
   */
  async unsafe_removeAccountSignatureText(identifier: Identifier) {
    try {
      const signatureText =
        await this.#innerClient.revokeIdentifierSignatureText(identifier);
      return signatureText;
    } catch {
      return undefined;
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `revokeAllOtherInstallations` function
   * instead.
   */
  async unsafe_revokeAllOtherInstallationsSignatureText() {
    try {
      const signatureText =
        await this.#innerClient.revokeAllOtherInstallationsSignatureText();
      return signatureText;
    } catch {
      return undefined;
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `revokeInstallations` function instead.
   */
  async unsafe_revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    try {
      const signatureText =
        await this.#innerClient.revokeInstallationsSignatureText(
          installationIds,
        );
      return signatureText;
    } catch {
      return undefined;
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `changeRecoveryIdentifer` function instead.
   */
  async unsafe_changeRecoveryIdentifierSignatureText(identifier: Identifier) {
    try {
      const signatureText =
        await this.#innerClient.changeRecoveryIdentifierSignatureText(
          identifier,
        );
      return signatureText;
    } catch {
      return undefined;
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `unsafe_addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, or `revokeInstallations`
   * functions instead.
   */
  async unsafe_addSignature(
    signatureType: SignatureRequestType,
    signatureText: string,
    signer: Signer,
  ) {
    switch (signer.type) {
      case "SCW":
        await this.#innerClient.addScwSignature(
          signatureType,
          await signer.signMessage(signatureText),
          signer.getChainId(),
          signer.getBlockNumber?.(),
        );
        break;
      case "EOA":
        await this.#innerClient.addEcdsaSignature(
          signatureType,
          await signer.signMessage(signatureText),
        );
        break;
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `unsafe_addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, or `revokeInstallations`
   * functions instead.
   */
  async unsafe_applySignatures() {
    return this.#innerClient.applySignatureRequests();
  }

  async register() {
    const signatureText = await this.unsafe_createInboxSignatureText();

    // if the signature text is not available, the client is already registered
    if (!signatureText) {
      return;
    }

    await this.unsafe_addSignature(
      SignatureRequestType.CreateInbox,
      signatureText,
      this.#signer,
    );

    return this.#innerClient.registerIdentity();
  }

  /**
   * WARNING: This function should be used with caution. Adding a wallet already
   * associated with an inboxId will cause the wallet to lose access to
   * that inbox.
   *
   * The `allowInboxReassign` parameter must be true to reassign an inbox
   * already associated with a different account.
   */
  async unsafe_addAccount(
    newAccountSigner: Signer,
    allowInboxReassign: boolean = false,
  ) {
    // check for existing inbox id
    const identifier = await newAccountSigner.getIdentifier();
    const existingInboxId = await this.getInboxIdByIdentifier(identifier);

    if (existingInboxId && !allowInboxReassign) {
      throw new Error(
        `Signer address already associated with inbox ${existingInboxId}`,
      );
    }

    const signatureText = await this.unsafe_addAccountSignatureText(
      identifier,
      true,
    );

    if (!signatureText) {
      throw new Error("Unable to generate add account signature text");
    }

    await this.unsafe_addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      newAccountSigner,
    );

    await this.unsafe_applySignatures();
  }

  async removeAccount(identifier: Identifier) {
    const signatureText =
      await this.unsafe_removeAccountSignatureText(identifier);

    if (!signatureText) {
      throw new Error("Unable to generate remove account signature text");
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeWallet,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  async revokeAllOtherInstallations() {
    const signatureText =
      await this.unsafe_revokeAllOtherInstallationsSignatureText();

    if (!signatureText) {
      throw new Error(
        "Unable to generate revoke all other installations signature text",
      );
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  async revokeInstallations(installationIds: Uint8Array[]) {
    const signatureText =
      await this.unsafe_revokeInstallationsSignatureText(installationIds);

    if (!signatureText) {
      throw new Error("Unable to generate revoke installations signature text");
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  async changeRecoveryIdentifier(identifier: Identifier) {
    const signatureText =
      await this.unsafe_changeRecoveryIdentifierSignatureText(identifier);

    if (!signatureText) {
      throw new Error(
        "Unable to generate change recovery identifier signature text",
      );
    }

    await this.unsafe_addSignature(
      SignatureRequestType.ChangeRecoveryIdentifier,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  async canMessage(identifiers: Identifier[]) {
    const canMessage = await this.#innerClient.canMessage(identifiers);
    return new Map(Object.entries(canMessage));
  }

  static async canMessage(identifiers: Identifier[], env?: XmtpEnv) {
    const canMessageMap = new Map<string, boolean>();
    for (const identifier of identifiers) {
      const inboxId = await getInboxIdForIdentifier(identifier, env);
      canMessageMap.set(identifier.identifier, inboxId !== null);
    }
    return canMessageMap;
  }

  async getKeyPackageStatusesForInstallationIds(installationIds: string[]) {
    return this.#innerClient.getKeyPackageStatusesForInstallationIds(
      installationIds,
    );
  }

  codecFor(contentType: ContentTypeId) {
    return this.#codecs.get(contentType.toString());
  }

  encodeContent(content: any, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(`no codec for ${contentType.toString()}`);
    }
    const encoded = codec.encode(content, this);
    const fallback = codec.fallback(content);
    if (fallback) {
      encoded.fallback = fallback;
    }
    return encoded;
  }

  decodeContent(message: Message, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(`no codec for ${contentType.toString()}`);
    }

    // throw an error if there's an invalid group membership change message
    if (
      contentType.sameAs(ContentTypeGroupUpdated) &&
      message.kind !== GroupMessageKind.MembershipChange
    ) {
      throw new Error("Error decoding group membership change");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return codec.decode(message.content as EncodedContent, this);
  }

  async requestHistorySync() {
    return this.#innerClient.sendHistorySyncRequest();
  }

  async getInboxIdByIdentifier(identifier: Identifier) {
    return this.#innerClient.findInboxIdByIdentifier(identifier);
  }

  signWithInstallationKey(signatureText: string) {
    return this.#innerClient.signWithInstallationKey(signatureText);
  }

  verifySignedWithInstallationKey(
    signatureText: string,
    signatureBytes: Uint8Array,
  ) {
    try {
      this.#innerClient.verifySignedWithInstallationKey(
        signatureText,
        signatureBytes,
      );
      return true;
    } catch {
      return false;
    }
  }

  static verifySignedWithPublicKey(
    signatureText: string,
    signatureBytes: Uint8Array,
    publicKey: Uint8Array,
  ) {
    try {
      verifySignedWithPublicKeyBinding(
        signatureText,
        signatureBytes,
        publicKey,
      );
      return true;
    } catch {
      return false;
    }
  }

  static async isAddressAuthorized(
    inboxId: string,
    address: string,
    options?: NetworkOptions,
  ): Promise<boolean> {
    const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
    return await isAddressAuthorizedBinding(host, inboxId, address);
  }

  static async isInstallationAuthorized(
    inboxId: string,
    installation: Uint8Array,
    options?: NetworkOptions,
  ): Promise<boolean> {
    const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
    return await isInstallationAuthorizedBinding(host, inboxId, installation);
  }

  static get version() {
    return version;
  }
}
