import {
  ContentTypeId,
  type ContentCodec,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import { WasmSignatureRequestType } from "@xmtp/wasm-bindings";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Client } from "@/Client";
import type { ClientOptions } from "@/types";

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
  };
};

export type User = ReturnType<typeof createUser>;

export const getSignature = async (client: Client, user: User) => {
  const signatureText = await client.getCreateInboxSignatureText();
  if (signatureText) {
    const signature = await user.wallet.signMessage({
      message: signatureText,
    });
    return toBytes(signature);
  }
  return null;
};

export const createClient = async (user: User, options?: ClientOptions) => {
  const opts = {
    ...options,
    env: options?.env ?? "local",
  };
  return Client.create(user.account.address, {
    ...opts,
    dbPath: `./test-${user.account.address}.db3`,
  });
};

export const createRegisteredClient = async (
  user: User,
  options?: ClientOptions,
) => {
  const client = await createClient(user, options);
  const isRegistered = await client.isRegistered();
  if (!isRegistered) {
    const signature = await getSignature(client, user);
    if (signature) {
      await client.addSignature(
        WasmSignatureRequestType.CreateInbox,
        signature,
      );
    }
    await client.registerIdentity();
  }
  return client;
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
