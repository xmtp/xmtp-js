import { getRandomValues } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { v4 } from "uuid";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client, type ClientOptions } from "@/Client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const testEncryptionKey = getRandomValues(new Uint8Array(32));

export const createUser = () => {
  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);
  return {
    key,
    account,
    wallet: createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    }),
    uuid: v4(),
  };
};

export const createSigner = (user: User) => {
  return {
    getAddress: () => user.account.address,
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

export type User = ReturnType<typeof createUser>;

export const createClient = async (user: User, options?: ClientOptions) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  return Client.create(createSigner(user), testEncryptionKey, {
    ...opts,
    disableAutoRegister: true,
    dbPath: join(__dirname, `./test-${user.uuid}.db3`),
  });
};

export const createRegisteredClient = async (
  user: User,
  options?: ClientOptions,
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  return Client.create(createSigner(user), testEncryptionKey, {
    ...opts,
    dbPath: join(__dirname, `./test-${user.uuid}.db3`),
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
