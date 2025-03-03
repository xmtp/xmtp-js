import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@xmtp/content-type-group-updated";
import type {
  ContentCodec,
  ContentTypeId,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import {
  GroupMessageKind,
  SignatureRequestType,
  type ConsentEntityType,
} from "@xmtp/wasm-bindings";
import { ClientWorkerClass } from "@/ClientWorkerClass";
import { Conversations } from "@/Conversations";
import type { ClientOptions, XmtpEnv } from "@/types";
import {
  fromSafeEncodedContent,
  toSafeEncodedContent,
  type SafeConsent,
  type SafeMessage,
} from "@/utils/conversions";
import { type Signer } from "@/utils/signer";

export class Client extends ClientWorkerClass {
  #accountAddress: string;
  #codecs: Map<string, ContentCodec>;
  #conversations: Conversations;
  #encryptionKey: Uint8Array;
  #inboxId: string | undefined;
  #installationId: string | undefined;
  #installationIdBytes: Uint8Array | undefined;
  #isReady = false;
  #signer: Signer;
  options?: ClientOptions;

  constructor(
    signer: Signer,
    accountAddress: string,
    encryptionKey: Uint8Array,
    options?: ClientOptions,
  ) {
    const worker = new Worker(new URL("./workers/client", import.meta.url), {
      type: "module",
    });
    super(
      worker,
      options?.loggingLevel !== undefined && options.loggingLevel !== "off",
    );
    this.#accountAddress = accountAddress;
    this.options = options;
    this.#encryptionKey = encryptionKey;
    this.#signer = signer;
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

  get accountAddress() {
    return this.#accountAddress;
  }

  async init() {
    const result = await this.sendMessage("init", {
      address: this.accountAddress,
      encryptionKey: this.#encryptionKey,
      options: this.options,
    });
    this.#inboxId = result.inboxId;
    this.#installationId = result.installationId;
    this.#installationIdBytes = result.installationIdBytes;
    this.#isReady = true;
  }

  static async create(
    signer: Signer,
    encryptionKey: Uint8Array,
    options?: ClientOptions,
  ) {
    const address = await signer.getAddress();
    const client = new Client(signer, address, encryptionKey, options);

    await client.init();

    if (!options?.disableAutoRegister) {
      await client.register();
    }

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

  get installationIdBytes() {
    return this.#installationIdBytes;
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register` function instead.
   */
  async unsafe_createInboxSignatureText() {
    return this.sendMessage("createInboxSignatureText", undefined);
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
    newAccountAddress: string,
    allowInboxReassign: boolean = false,
  ) {
    if (!allowInboxReassign) {
      throw new Error(
        "Unable to create add account signature text, `allowInboxReassign` must be true",
      );
    }

    return this.sendMessage("addAccountSignatureText", {
      newAccountAddress,
    });
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `removeAccount` function instead.
   */
  async unsafe_removeAccountSignatureText(accountAddress: string) {
    return this.sendMessage("removeAccountSignatureText", { accountAddress });
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
    return this.sendMessage(
      "revokeAllOtherInstallationsSignatureText",
      undefined,
    );
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `revokeInstallations` function instead.
   */
  async unsafe_revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    return this.sendMessage("revokeInstallationsSignatureText", {
      installationIds,
    });
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, or `revokeInstallations`
   * functions instead.
   */
  async unsafe_addSignature(
    signatureType: SignatureRequestType,
    signatureText: string,
    signer: Signer,
  ) {
    const signature = await signer.signMessage(signatureText);

    if (signer.walletType === "SCW") {
      await this.sendMessage("addScwSignature", {
        type: signatureType,
        bytes: signature,
        chainId: signer.getChainId(),
        blockNumber: signer.getBlockNumber?.(),
      });
    } else {
      await this.sendMessage("addSignature", {
        type: signatureType,
        bytes: signature,
      });
    }
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, or `revokeInstallations`
   * functions instead.
   */
  async unsafe_applySignatures() {
    return this.sendMessage("applySignatures", undefined);
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

    return this.sendMessage("registerIdentity", undefined);
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
    const existingInboxId = await this.findInboxIdByAddress(
      await newAccountSigner.getAddress(),
    );

    if (existingInboxId && !allowInboxReassign) {
      throw new Error(
        `Signer address already associated with inbox ${existingInboxId}`,
      );
    }

    const signatureText = await this.unsafe_addAccountSignatureText(
      await newAccountSigner.getAddress(),
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

  async removeAccount(accountAddress: string) {
    const signatureText =
      await this.unsafe_removeAccountSignatureText(accountAddress);

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

  async isRegistered() {
    return this.sendMessage("isRegistered", undefined);
  }

  async canMessage(accountAddresses: string[]) {
    return this.sendMessage("canMessage", { accountAddresses });
  }

  static async canMessage(accountAddresses: string[], env?: XmtpEnv) {
    const accountAddress = "0x0000000000000000000000000000000000000000";
    const signer: Signer = {
      walletType: "EOA",
      getAddress: () => accountAddress,
      signMessage: () => new Uint8Array(),
    };
    const client = await Client.create(
      signer,
      window.crypto.getRandomValues(new Uint8Array(32)),
      {
        disableAutoRegister: true,
        env,
      },
    );
    return client.canMessage(accountAddresses);
  }

  async findInboxIdByAddress(address: string) {
    return this.sendMessage("findInboxIdByAddress", { address });
  }

  async inboxState(refreshFromNetwork?: boolean) {
    return this.sendMessage("inboxState", {
      refreshFromNetwork: refreshFromNetwork ?? false,
    });
  }

  async getLatestInboxState(inboxId: string) {
    return this.sendMessage("getLatestInboxState", { inboxId });
  }

  async setConsentStates(records: SafeConsent[]) {
    return this.sendMessage("setConsentStates", { records });
  }

  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.sendMessage("getConsentState", { entityType, entity });
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
      message.kind !== GroupMessageKind.MembershipChange
    ) {
      throw new Error("Error decoding group membership change");
    }

    const encodedContent = fromSafeEncodedContent(message.content);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return codec.decode(encodedContent, this);
  }

  signWithInstallationKey(signatureText: string) {
    return this.sendMessage("signWithInstallationKey", { signatureText });
  }

  verifySignedWithInstallationKey(
    signatureText: string,
    signatureBytes: Uint8Array,
  ) {
    return this.sendMessage("verifySignedWithInstallationKey", {
      signatureText,
      signatureBytes,
    });
  }

  verifySignedWithPublicKey(
    signatureText: string,
    signatureBytes: Uint8Array,
    publicKey: Uint8Array,
  ) {
    return this.sendMessage("verifySignedWithPublicKey", {
      signatureText,
      signatureBytes,
      publicKey,
    });
  }
}
