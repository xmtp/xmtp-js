import {
  ContentTypeMiniApp,
  type MiniAppContent,
} from "@xmtp/content-type-mini-app";
import { v4 } from "uuid";
import { uiPlay } from "../apps/play";
import { client } from "../client";
import { manifest } from "../manifest";

export const play = async (inboxId: string) => {
  const dm = await client.conversations.newDm(inboxId);
  const uuid = v4();
  const message: MiniAppContent = {
    type: "action",
    manifest,
    action: uiPlay(uuid),
  };
  await dm.send(message, ContentTypeMiniApp);
};
