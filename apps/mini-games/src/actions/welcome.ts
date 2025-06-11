import {
  ContentTypeMiniApp,
  type MiniAppContent,
} from "@xmtp/content-type-mini-app";
import type { Dm, Group } from "@xmtp/node-sdk";
import { v4 } from "uuid";
import { uiWelcome } from "../apps/welcome";
import { client } from "../client";
import type { ContentTypes } from "../data";
import { manifest } from "../manifest";

export const welcomeUser = async (inboxId: string) => {
  const dm = await client.conversations.newDm(inboxId);
  const uuid = v4();
  const message: MiniAppContent = {
    type: "action",
    manifest,
    action: uiWelcome(uuid, inboxId),
  };
  await dm.send(message, ContentTypeMiniApp);
};

export const welcomeConversation = async (
  conversation: Group<ContentTypes> | Dm<ContentTypes>,
) => {
  const uuid = v4();
  const message: MiniAppContent = {
    type: "action",
    manifest,
    action: uiWelcome(uuid),
  };
  await conversation.send(message, ContentTypeMiniApp);
};
