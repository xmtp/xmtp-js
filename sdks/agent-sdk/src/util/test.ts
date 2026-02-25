import {
  type ContentCodec,
  type ContentTypeId,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import {
  Client,
  generateInboxId,
  type ClientOptions,
  type NetworkOptions,
} from "@xmtp/node-sdk";
import { createSigner, createUser } from "@/user/User";

export const createClient = async <ContentCodecs extends ContentCodec[] = []>(
  options?: Omit<ClientOptions & NetworkOptions, "codecs"> & {
    codecs?: ContentCodecs;
  },
) => {
  const signer = createSigner(createUser());
  const identifier = await signer.getIdentifier();
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
  } as Omit<ClientOptions & NetworkOptions, "codecs"> & {
    codecs?: ContentCodecs;
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
