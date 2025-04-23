import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { describe, expect, it } from "vitest";
import { ContentTypeMiniApp, MiniAppCodec } from "./MiniApp";
import type { HelpAction } from "./types/actions";
import type { MiniAppActionContent } from "./types/content";

export const createSigner = (): Signer => {
  const account = privateKeyToAccount(generatePrivateKey());
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: account.address.toLowerCase(),
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

describe("ContentTypeMiniApp", () => {
  it("has the right content type", () => {
    expect(ContentTypeMiniApp.authorityId).toBe("xmtp.org");
    expect(ContentTypeMiniApp.typeId).toBe("mini-app");
    expect(ContentTypeMiniApp.versionMajor).toBe(1);
    expect(ContentTypeMiniApp.versionMinor).toBe(0);
  });

  it("can encode/decode mini app data", () => {
    const miniApp: MiniAppActionContent<HelpAction> = {
      type: "action",
      manifest: {
        name: "Mini App",
        version: "1.0.0",
        schemaVersion: "1",
        author: "XMTP",
      },
      action: {
        type: "help",
        payload: {
          version: "1.0.0",
          commands: [
            {
              name: "help",
              context: "dm",
            },
          ],
        },
      },
    };
    const codec = new MiniAppCodec();
    const ec = codec.encode(miniApp);
    expect(ec.type.sameAs(ContentTypeMiniApp)).toBe(true);
    const decodedMiniApp = codec.decode(ec);
    expect(decodedMiniApp).toEqual(miniApp);
  });

  it("can send a mini app message", async () => {
    const signer1 = createSigner();
    const client1 = await Client.create(signer1, {
      codecs: [new MiniAppCodec()],
      env: "local",
    });

    const signer2 = createSigner();
    const client2 = await Client.create(signer2, {
      codecs: [new MiniAppCodec()],
      env: "local",
    });

    const dm = await client1.conversations.newDm(client2.inboxId);

    const miniApp: MiniAppActionContent<HelpAction> = {
      type: "action",
      manifest: {
        name: "Mini App",
        version: "1.0.0",
        schemaVersion: "1",
        author: "XMTP",
      },
      action: {
        type: "help",
        payload: {
          version: "1.0.0",
          commands: [
            {
              name: "help",
              context: "dm",
            },
          ],
        },
      },
    };

    await dm.send(miniApp, ContentTypeMiniApp);

    await client2.conversations.sync();
    const dms = client2.conversations.listDms();

    expect(dms.length).toBe(1);

    await dms[0].sync();
    const messages = await dms[0].messages();
    expect(messages.length).toBe(1);

    const messageContent = messages[0]
      .content as MiniAppActionContent<HelpAction>;
    expect(messageContent.type).toBe("action");
    expect(messageContent.manifest.name).toBe("Mini App");
    expect(messageContent.manifest.version).toBe("1.0.0");
    expect(messageContent.manifest.schemaVersion).toBe("1");
    expect(messageContent.manifest.author).toBe("XMTP");
    expect(messageContent.action.type).toBe("help");
    expect(messageContent.action.payload.version).toBe("1.0.0");
    expect(messageContent.action.payload.commands.length).toBe(1);
    expect(messageContent.action.payload.commands[0].name).toBe("help");
    expect(messageContent.action.payload.commands[0].context).toBe("dm");
  });
});
