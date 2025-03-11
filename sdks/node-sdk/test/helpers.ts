import { getRandomValues } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { generateInboxId, IdentifierKind } from "@xmtp/node-bindings";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client, HistorySyncUrls, type ClientOptions } from "@/Client";
import type { Signer } from "@/helpers/signer";

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
      return toBytes(signature);
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
