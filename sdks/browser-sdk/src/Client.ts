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
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ClientWorkerClass } from "@/ClientWorkerClass";
import { Conversations } from "@/Conversations";
import { Opfs } from "@/Opfs";
import { Preferences } from "@/Preferences";
import type { ClientOptions, XmtpEnv } from "@/types";
import {
  fromSafeEncodedContent,
  toSafeEncodedContent,
  type SafeMessage,
} from "@/utils/conversions";
import { type Signer } from "@/utils/signer";

export class Client extends ClientWorkerClass {
  #codecs: Map<string, ContentCodec>;
  #conversations: Conversations;
  #encryptionKey: Uint8Array;
  #inboxId: string | undefined;
  #installationId: string | undefined;
  #installationIdBytes: Uint8Array | undefined;
  #isReady = false;
  #preferences: Preferences;
  #signer: Signer;
  opfs: Opfs;
  options?: ClientOptions;

  constructor(
    signer: Signer,
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
    this.options = options;
    this.opfs = new Opfs(this);
    this.#encryptionKey = encryptionKey;
    this.#signer = signer;
    this.#conversations = new Conversations(this);
    this.#preferences = new Preferences(this);
    const codecs = [
      new GroupUpdatedCodec(),
      new TextCodec(),
      ...(options?.codecs ?? []),
    ];
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  async init() {
    const result = await this.sendMessage("init", {
      identifier: await this.#signer.getIdentifier(),
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
    const client = new Client(signer, encryptionKey, options);

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

  async accountIdentifier() {
    return this.#signer.getIdentifier();
  }

  get installationId() {
    return this.#installationId;
  }

  get installationIdBytes() {
    return this.#installationIdBytes;
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
    newIdentifier: Identifier,
    allowInboxReassign: boolean = false,
  ) {
    if (!allowInboxReassign) {
      throw new Error(
        "Unable to create add account signature text, `allowInboxReassign` must be true",
      );
    }

    return this.sendMessage("addAccountSignatureText", {
      newIdentifier,
    });
  }

  /**
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `removeAccount` function instead.
   */
  async unsafe_removeAccountSignatureText(identifier: Identifier) {
    return this.sendMessage("removeAccountSignatureText", {
      identifier,
    });
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

    switch (signer.type) {
      case "SCW":
        await this.sendMessage("addScwSignature", {
          type: signatureType,
          bytes: signature,
          chainId: signer.getChainId(),
          blockNumber: signer.getBlockNumber?.(),
        });
        break;
      case "EOA":
        await this.sendMessage("addEcdsaSignature", {
          type: signatureType,
          bytes: signature,
        });
        break;
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
    const existingInboxId = await this.findInboxIdByIdentifier(
      await newAccountSigner.getIdentifier(),
    );

    if (existingInboxId && !allowInboxReassign) {
      throw new Error(
        `Signer address already associated with inbox ${existingInboxId}`,
      );
    }

    const signatureText = await this.unsafe_addAccountSignatureText(
      await newAccountSigner.getIdentifier(),
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

  async removeAccount(accountIdentifier: Identifier) {
    const signatureText =
      await this.unsafe_removeAccountSignatureText(accountIdentifier);

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

  async canMessage(identifiers: Identifier[]) {
    return this.sendMessage("canMessage", { identifiers });
  }

  static async canMessage(identifiers: Identifier[], env?: XmtpEnv) {
    const signer: Signer = {
      type: "EOA",
      getIdentifier: () => ({
        identifier: "0x0000000000000000000000000000000000000000",
        identifierKind: "Ethereum",
      }),
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
    return client.canMessage(identifiers);
  }

  async findInboxIdByIdentifier(identifier: Identifier) {
    return this.sendMessage("findInboxIdByIdentifier", { identifier });
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
