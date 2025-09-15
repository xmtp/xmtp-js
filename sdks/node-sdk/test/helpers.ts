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
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client } from "@/Client";
import { HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types";
import type { Signer } from "@/utils/signer";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

export const createIdentifier = (user: User): Identifier => ({
  identifier: user.account.address.toLowerCase(),
  identifierKind: IdentifierKind.Ethereum,
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
  options?: Omit<ClientOptions, "codecs"> & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  const inboxId = generateInboxId(await signer.getIdentifier());

  let dbPath: string;
  if (typeof opts.dbPath === "function") {
    dbPath = opts.dbPath(inboxId);
  } else {
    dbPath = join(__dirname, opts.dbPath ?? `./test-${inboxId}.db3`);
  }

  const client = await Client.create<ContentCodecs>(signer, {
    ...opts,
    disableAutoRegister: true,
    dbPath: dbPath,
    historySyncUrl: HistorySyncUrls.local,
  });
  return client;
};

export const createRegisteredClient = async <
  ContentCodecs extends ContentCodec[] = [],
>(
  signer: Signer,
  options?: Omit<ClientOptions, "codecs"> & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  const inboxId = generateInboxId(await signer.getIdentifier());

  let dbPath: string;
  if (typeof opts.dbPath === "function") {
    dbPath = opts.dbPath(inboxId);
  } else {
    dbPath = opts.dbPath ?? `./test-${inboxId}.db3`;
  }

  return Client.create<ContentCodecs>(signer, {
    ...opts,
    dbPath,
    historySyncUrl: HistorySyncUrls.local,
  });
};

export const ContentTypeTest = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "test",
  versionMajor: 1,
  versionMinor: 0,
});

export class TestCodec
  implements ContentCodec<Record<string, string>, Record<string, never>>
{
  get contentType(): ContentTypeId {
    return ContentTypeTest;
  }

  encode(
    content: Record<string, string>,
  ): EncodedContent<Record<string, never>> {
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }

  decode(
    content: EncodedContent<Record<string, never>>,
  ): Record<string, string> {
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
