import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { v4 } from "uuid";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client } from "@/Client";
import type { ClientOptions } from "@/types";
import type { Signer } from "@/utils/signer";

const testEncryptionKey = window.crypto.getRandomValues(new Uint8Array(32));

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

export const createSigner = (user: User): Signer => {
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
    dbPath: `./test-${user.uuid}.db3`,
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
    dbPath: `./test-${user.uuid}.db3`,
  });
};

export const ContentTypeTest = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "test",
  versionMajor: 1,
  versionMinor: 0,
});

export class TestCodec implements ContentCodec {
  get contentType(): ContentTypeId {
    return ContentTypeTest;
  }

  encode(content: Record<string, string>) {
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
