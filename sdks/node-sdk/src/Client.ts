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
import {
  AccountAlreadyAssociatedError,
  ClientNotInitializedError,
  CodecNotFoundError,
  GenerateSignatureError,
  InboxReassignError,
  InvalidGroupMembershipChangeError,
  SignerUnavailableError,
} from "@/utils/errors";
import { getInboxIdForIdentifier } from "@/utils/inboxId";
import { type Signer } from "@/utils/signer";
import { version } from "@/utils/version";

export class Client {
  #client?: NodeClient;
  #conversations?: Conversations;
  #preferences?: Preferences;
  #signer?: Signer;
  #codecs: Map<string, ContentCodec>;
  #identifier?: Identifier;
  #options?: ClientOptions;

  constructor(options?: ClientOptions) {
    this.#options = options;
    const codecs = [
      new GroupUpdatedCodec(),
      new TextCodec(),
      ...(options?.codecs ?? []),
    ];
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  async init(identifier: Identifier) {
    if (this.#client) {
      return;
    }

    this.#identifier = identifier;
    this.#client = await createClient(identifier, this.#options);
    const conversations = this.#client.conversations();
    this.#conversations = new Conversations(this, conversations);
    this.#preferences = new Preferences(this.#client, conversations);
  }

  static async create(signer: Signer, options?: ClientOptions) {
    const identifier = await signer.getIdentifier();
    const client = new Client(options);
    client.#signer = signer;
    await client.init(identifier);

    if (!options?.disableAutoRegister) {
      await client.register();
    }

    return client;
  }

  static async build(identifier: Identifier, options?: ClientOptions) {
    const client = new Client({
      ...options,
      disableAutoRegister: true,
    });
    await client.init(identifier);
    return client;
  }

  get options() {
    return this.#options;
  }

  get signer() {
    return this.#signer;
  }

  get accountIdentifier() {
    return this.#identifier;
  }

  get inboxId() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.inboxId();
  }

  get installationId() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.installationId();
  }

  get installationIdBytes() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.installationIdBytes();
  }

  get isRegistered() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.isRegistered();
  }

  get conversations() {
    if (!this.#conversations) {
      throw new ClientNotInitializedError();
    }
    return this.#conversations;
  }

  get preferences() {
    if (!this.#preferences) {
      throw new ClientNotInitializedError();
    }
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText = await this.#client.createInboxSignatureText();
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!allowInboxReassign) {
      throw new InboxReassignError();
    }

    try {
      const signatureText =
        await this.#client.addIdentifierSignatureText(newAccountIdentifier);
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.revokeIdentifierSignatureText(identifier);
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.revokeAllOtherInstallationsSignatureText();
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.revokeInstallationsSignatureText(installationIds);
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.changeRecoveryIdentifierSignatureText(identifier);
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    switch (signer.type) {
      case "SCW":
        await this.#client.addScwSignature(
          signatureType,
          await signer.signMessage(signatureText),
          signer.getChainId(),
          signer.getBlockNumber?.(),
        );
        break;
      case "EOA":
        await this.#client.addEcdsaSignature(
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.applySignatureRequests();
  }

  async register() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

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

    return this.#client.registerIdentity();
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    // check for existing inbox id
    const identifier = await newAccountSigner.getIdentifier();
    const existingInboxId = await this.getInboxIdByIdentifier(identifier);

    if (existingInboxId && !allowInboxReassign) {
      throw new AccountAlreadyAssociatedError(existingInboxId);
    }

    const signatureText = await this.unsafe_addAccountSignatureText(
      identifier,
      true,
    );

    if (!signatureText) {
      throw new GenerateSignatureError(SignatureRequestType.AddWallet);
    }

    await this.unsafe_addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      newAccountSigner,
    );

    await this.unsafe_applySignatures();
  }

  async removeAccount(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_removeAccountSignatureText(identifier);

    if (!signatureText) {
      throw new GenerateSignatureError(SignatureRequestType.RevokeWallet);
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeWallet,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  async revokeAllOtherInstallations() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_revokeAllOtherInstallationsSignatureText();

    if (!signatureText) {
      throw new GenerateSignatureError(
        SignatureRequestType.RevokeInstallations,
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_revokeInstallationsSignatureText(installationIds);

    if (!signatureText) {
      throw new GenerateSignatureError(
        SignatureRequestType.RevokeInstallations,
      );
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  async changeRecoveryIdentifier(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_changeRecoveryIdentifierSignatureText(identifier);

    if (!signatureText) {
      throw new GenerateSignatureError(
        SignatureRequestType.ChangeRecoveryIdentifier,
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    const canMessage = await this.#client.canMessage(identifiers);
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
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.getKeyPackageStatusesForInstallationIds(
      installationIds,
    );
  }

  codecFor(contentType: ContentTypeId) {
    return this.#codecs.get(contentType.toString());
  }

  encodeContent(content: any, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new CodecNotFoundError(contentType);
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
      throw new CodecNotFoundError(contentType);
    }

    // throw an error if there's an invalid group membership change message
    if (
      contentType.sameAs(ContentTypeGroupUpdated) &&
      message.kind !== GroupMessageKind.MembershipChange
    ) {
      throw new InvalidGroupMembershipChangeError(message.id);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return codec.decode(message.content as EncodedContent, this);
  }

  async requestHistorySync() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.sendHistorySyncRequest();
  }

  async getInboxIdByIdentifier(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.findInboxIdByIdentifier(identifier);
  }

  signWithInstallationKey(signatureText: string) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.signWithInstallationKey(signatureText);
  }

  verifySignedWithInstallationKey(
    signatureText: string,
    signatureBytes: Uint8Array,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

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
