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
import { isSmartContractSigner, type Signer } from "@/utils/signer";

export class Client extends ClientWorkerClass {
  #accountAddress: string;
  #codecs: Map<string, ContentCodec>;
  #conversations: Conversations;
  #encryptionKey: Uint8Array;
  #inboxId: string | undefined;
  #installationId: string | undefined;
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

  async #createInboxSignatureText() {
    return this.sendMessage("createInboxSignatureText", undefined);
  }

  async #addAccountSignatureText(newAccountAddress: string) {
    return this.sendMessage("addAccountSignatureText", {
      newAccountAddress,
    });
  }

  async #removeAccountSignatureText(accountAddress: string) {
    return this.sendMessage("removeAccountSignatureText", { accountAddress });
  }

  async #revokeInstallationsSignatureText() {
    return this.sendMessage("revokeInstallationsSignatureText", undefined);
  }

  async #addSignature(
    signatureType: SignatureRequestType,
    signatureText: string,
    signer: Signer,
  ) {
    const signature = await signer.signMessage(signatureText);

    if (isSmartContractSigner(signer)) {
      await this.sendMessage("addScwSignature", {
        type: signatureType,
        bytes: signature,
        chainId: signer.getChainId(),
        blockNumber: signer.getBlockNumber(),
      });
    } else {
      await this.sendMessage("addSignature", {
        type: signatureType,
        bytes: signature,
      });
    }
  }

  async #applySignatures() {
    return this.sendMessage("applySignatures", undefined);
  }

  async register() {
    const signatureText = await this.#createInboxSignatureText();

    // if the signature text is not available, the client is already registered
    if (!signatureText) {
      return;
    }

    await this.#addSignature(
      SignatureRequestType.CreateInbox,
      signatureText,
      this.#signer,
    );

    return this.sendMessage("registerIdentity", undefined);
  }

  async addAccount(newAccountSigner: Signer) {
    const signatureText = await this.#addAccountSignatureText(
      await newAccountSigner.getAddress(),
    );

    if (!signatureText) {
      throw new Error("Unable to generate add account signature text");
    }

    await this.#addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      this.#signer,
    );

    await this.#addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      newAccountSigner,
    );

    await this.#applySignatures();
  }

  async removeAccount(accountAddress: string) {
    const signatureText =
      await this.#removeAccountSignatureText(accountAddress);

    if (!signatureText) {
      throw new Error("Unable to generate remove account signature text");
    }

    await this.#addSignature(
      SignatureRequestType.RevokeWallet,
      signatureText,
      this.#signer,
    );

    await this.#applySignatures();
  }

  async revokeInstallations() {
    const signatureText = await this.#revokeInstallationsSignatureText();

    if (!signatureText) {
      throw new Error("Unable to generate revoke installations signature text");
    }

    await this.#addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.#applySignatures();
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
}
