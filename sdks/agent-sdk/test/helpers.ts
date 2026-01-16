import {
  type ContentCodec,
  type ContentTypeId,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  Client,
  generateInboxId,
  IdentifierKind,
  type ClientOptions,
  type Identifier,
  type Signer,
} from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

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

export const createSigner = () => {
  const user = createUser();
  const identifier = createIdentifier(user);
  const signer: Signer = {
    type: "EOA",
    getIdentifier: () => identifier,
    signMessage: async (message: string) => {
      const signature = await user.wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
  return {
    address: user.account.address.toLowerCase(),
    identifier,
    signer,
    user,
  };
};

export type User = ReturnType<typeof createUser>;

export const createClient = async <ContentCodecs extends ContentCodec[] = []>(
  options?: Omit<ClientOptions, "codecs"> & {
    codecs?: ContentCodecs;
  },
) => {
  const { signer, identifier } = createSigner();
  const inboxId = generateInboxId(identifier);

  let dbPath: string;
  if (typeof options?.dbPath === "function") {
    dbPath = options.dbPath(inboxId);
  } else {
    dbPath = options?.dbPath ?? `./test-${inboxId}.db3`;
  }

  return Client.create<ContentCodecs>(signer, {
    ...options,
    dbPath,
    historySyncUrl: undefined,
    disableDeviceSync: true,
    env: "local",
  });
};

export const ContentTypeTest: ContentTypeId = {
  authorityId: "xmtp.org",
  typeId: "test",
  versionMajor: 1,
  versionMinor: 0,
};

export class TestCodec implements ContentCodec {
  contentType = ContentTypeTest;
  encode(content: Record<string, string>): EncodedContent {
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
