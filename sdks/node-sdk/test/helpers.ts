import {
  createHash,
  createSign,
  generateKeyPairSync,
  getRandomValues,
  type KeyPairKeyObjectResult,
} from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  generateInboxId,
  IdentifierKind,
  type Identifier,
} from "@xmtp/node-bindings";
import {
  hexToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHex,
} from "uint8array-extras";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client, HistorySyncUrls, type ClientOptions } from "@/Client";
import type { SignedData, Signer } from "@/helpers/signer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const testEncryptionKey = getRandomValues(new Uint8Array(32));

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createUser = (key?: `0x${string}`) => {
  const accountKey = key ?? generatePrivateKey();
  const account = privateKeyToAccount(accountKey);
  return {
    key: accountKey,
    account,
    wallet: createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    }),
  };
};

export const createSigner = (user: User): Signer => {
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: user.account.address.toLowerCase(),
    }),
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        message,
      });
      return { signature: toBytes(signature) };
    },
  };
};

export type User = ReturnType<typeof createUser>;

export const createClient = async (signer: Signer, options?: ClientOptions) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  const inboxId = generateInboxId(await signer.getIdentifier());
  return Client.create(signer, testEncryptionKey, {
    ...opts,
    disableAutoRegister: true,
    dbPath: join(__dirname, opts.dbPath ?? `./test-${inboxId}.db3`),
    historySyncUrl: HistorySyncUrls.local,
  });
};

export const createRegisteredClient = async (
  signer: Signer,
  options?: ClientOptions,
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  const inboxId = generateInboxId(await signer.getIdentifier());
  return Client.create(signer, testEncryptionKey, {
    ...opts,
    dbPath: join(__dirname, opts.dbPath ?? `./test-${inboxId}.db3`),
    historySyncUrl: HistorySyncUrls.local,
  });
};

export const ContentTypeTest = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "test",
  versionMajor: 1,
  versionMinor: 0,
});

export class TestCodec implements ContentCodec<Record<string, string>> {
  get contentType(): ContentTypeId {
    return ContentTypeTest;
  }

  encode(content: Record<string, string>): EncodedContent {
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(content: EncodedContent) {
    const decoded = new TextDecoder().decode(content.content);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(decoded);
  }

  fallback() {
    return undefined;
  }

  shouldPush() {
    return false;
  }
}

export const createPasskeySigner = (): Signer => {
  const passkeyAuthenticator = new PasskeyAuthenticator();

  return {
    type: "PASSKEY",
    getIdentifier: (): Identifier => ({
      identifierKind: IdentifierKind.Passkey,
      identifier: passkeyAuthenticator.publicKeyString,
    }),
    signMessage: (message: string): SignedData => {
      const { clientDataJson, authenticatorData, signature } =
        passkeyAuthenticator.sign(message);

      return {
        signature,
        publicKey: passkeyAuthenticator.publicKey,
        authenticatorData: authenticatorData,
        clientDataJson: clientDataJson,
      };
    },
  };
};

export class PasskeyAuthenticator {
  #keyPair: KeyPairKeyObjectResult;

  constructor() {
    this.#keyPair = generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
    });
  }

  get publicKeyString() {
    return uint8ArrayToHex(this.publicKey);
  }

  get publicKey() {
    const publicKey = this.#keyPair.publicKey
      .export({
        type: "spki",
        format: "der",
      })
      .toString("hex");
    const publicKeyBytes = hexToUint8Array(publicKey);
    if (publicKeyBytes.length < 27) {
      throw new Error("Invalid public key");
    }
    return publicKeyBytes.slice(26);
  }

  get identifier(): Identifier {
    return {
      identifier: this.publicKeyString,
      identifierKind: IdentifierKind.Passkey,
    };
  }

  #generateClientDataJson(message: string) {
    const messageBytes = new TextEncoder().encode(message);
    const json = {
      type: "webauthn.get",
      origin: "https://xmtp.chat",
      crossOrigin: false,
      challenge: uint8ArrayToBase64(messageBytes)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, ""), // ✅ Force Base64Url encoding
    };

    const jsonString = JSON.stringify(json);
    return new TextEncoder().encode(jsonString);
  }

  #generateAuthenticatorData() {
    const messageBytes = new TextEncoder().encode("xmtp.chat");
    const hash = createHash("sha256").update(messageBytes).digest("hex");
    const hashBytes = hexToUint8Array(hash);
    const flags = new Uint8Array([1]);
    const signCount = new Uint8Array([0, 0, 0, 1]);
    return new Uint8Array([...hashBytes, ...flags, ...signCount]);
  }

  #signPasskeyData(clientData: Uint8Array, authenticatorData: Uint8Array) {
    const clientDataHash = createHash("sha256")
      .update(clientData)
      .digest("hex");
    const clientDataHashBytes = hexToUint8Array(clientDataHash);
    const signedData = new Uint8Array([
      ...authenticatorData,
      ...clientDataHashBytes,
    ]);
    const sign = createSign("SHA256");
    sign.update(signedData);
    sign.end();
    const signature = sign.sign(this.#keyPair.privateKey, "hex");
    return hexToUint8Array(signature);
  }

  sign(message: string) {
    const clientDataJson = this.#generateClientDataJson(message);
    const authenticatorData = this.#generateAuthenticatorData();
    const signature = this.#signPasskeyData(clientDataJson, authenticatorData);
    return {
      clientDataJson,
      authenticatorData,
      signature,
    };
  }
}
