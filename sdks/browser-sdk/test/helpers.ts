import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import type { Identifier } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client } from "@/Client";
import type { ClientOptions } from "@/types/options";
import type { Signer } from "@/utils/signer";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

export const createIdentifier = (user: User): Identifier => ({
  identifier: user.account.address.toLowerCase(),
  identifierKind: "Ethereum",
});

export const createSigner = (user: User): Signer => {
  const identifier = createIdentifier(user);
  return {
    type: "EOA",
    getIdentifier: () => identifier,
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

export type User = ReturnType<typeof createUser>;

export const buildClient = async <ContentCodecs extends ContentCodec[] = []>(
  identifier: Identifier,
  options?: ClientOptions & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  return Client.build<ContentCodecs>(identifier, {
    ...opts,
    dbPath: opts.dbPath ?? `./test-${identifier.identifier}.db3`,
  });
};

export const createClient = async <ContentCodecs extends ContentCodec[] = []>(
  signer: Signer,
  options?: ClientOptions & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  const identifier = await signer.getIdentifier();
  return Client.create<ContentCodecs>(signer, {
    ...opts,
    disableAutoRegister: true,
    dbPath: opts.dbPath ?? `./test-${identifier.identifier}.db3`,
  });
};

export const createRegisteredClient = async <
  ContentCodecs extends ContentCodec[] = [],
>(
  signer: Signer,
  options?: ClientOptions & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  const identifier = await signer.getIdentifier();
  return Client.create<ContentCodecs>(signer, {
    ...opts,
    dbPath: opts.dbPath ?? `./test-${identifier.identifier}.db3`,
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

  decode(content: EncodedContent): Record<string, string> {
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
