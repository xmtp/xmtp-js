import type {
  ContentCodec,
  EncodedContent,
} from "@xmtp/content-type-primitives";
import { type ContentTypeId, type Identifier } from "@xmtp/wasm-bindings";
import { Client } from "@/Client";
import type {
  ContentOptions,
  DeviceSyncOptions,
  NetworkOptions,
  OtherOptions,
  StorageOptions,
} from "@/types/options";
import { createEOASigner, type Signer } from "@/utils/signer";

type TestClientOptions = NetworkOptions &
  DeviceSyncOptions &
  ContentOptions &
  StorageOptions &
  OtherOptions;

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitFor = async (
  condition: () => boolean,
  { timeout = 2000, interval = 10 } = {},
) => {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error(`waitFor timed out after ${timeout}ms`);
    }
    await sleep(interval);
  }
};

export const createSigner = () => {
  const signer = createEOASigner();
  const identifier = signer.getIdentifier() as Identifier;
  return {
    address: identifier.identifier,
    identifier,
    signer,
  };
};

export const buildClient = async <ContentCodecs extends ContentCodec[] = []>(
  identifier: Identifier,
  options?: TestClientOptions & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? ("local" as const),
  };
  return Client.build<ContentCodecs>(identifier, {
    ...opts,
    dbPath: opts.dbPath ?? `./test-${identifier.identifier}.db3`,
  });
};

export const createClient = async <ContentCodecs extends ContentCodec[] = []>(
  signer: Signer,
  options?: TestClientOptions & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? ("local" as const),
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
  options?: TestClientOptions & {
    codecs?: ContentCodecs;
  },
) => {
  const opts = {
    ...options,
    env: options?.env ?? ("local" as const),
  };
  const identifier = await signer.getIdentifier();
  return Client.create<ContentCodecs>(signer, {
    ...opts,
    dbPath: opts.dbPath ?? `./test-${identifier.identifier}.db3`,
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

export class DecodeFailureCodec implements ContentCodec {
  contentType = {
    authorityId: "test",
    typeId: "decode-failure",
    versionMajor: 1,
    versionMinor: 0,
  };

  encode(content: string): EncodedContent {
    return {
      type: this.contentType,
      parameters: {},
      content: new TextEncoder().encode(content),
    };
  }

  decode(_content: EncodedContent): string {
    throw new Error("Decode failure");
  }

  fallback() {
    return undefined;
  }

  shouldPush() {
    return false;
  }
}
