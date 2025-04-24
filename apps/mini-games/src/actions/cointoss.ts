import {
  ContentTypeMiniApp,
  type MiniAppContent,
} from "@xmtp/content-type-mini-app";
import { v4 } from "uuid";
import { uiCointossPlay, uiCointossResult } from "../apps/cointoss";
import { client } from "../client";
import { actions, games } from "../data";
import { manifest } from "../manifest";

export const startCointoss = async (inboxId: string) => {
  const dm = await client.conversations.newDm(inboxId);
  const uuid = v4();
  actions.set(uuid, { uuid, type: "cointoss", completed: false });
  const message: MiniAppContent = {
    type: "action",
    manifest,
    action: uiCointossPlay(uuid),
  };
  await dm.send(message, ContentTypeMiniApp);
};

export const playCointoss = async (
  actionUuid: string,
  inboxId: string,
  groupId: string,
  move: "heads" | "tails",
) => {
  const action = actions.get(actionUuid);
  if (!action) {
    console.error(`Cointoss action ${actionUuid} not found`);
    return;
  }
  const result = Math.random() < 0.5 ? "heads" : "tails";
  const gameUuid = v4();
  games.set(gameUuid, {
    uuid: gameUuid,
    type: "cointoss",
    move,
    result,
    player: inboxId,
    groupId,
    createdAt: Date.now(),
  });
  actions.set(actionUuid, {
    uuid: actionUuid,
    type: "cointoss",
    completed: true,
  });
  await sendCointossResult(actionUuid, inboxId, result, move === result);
};

export const sendCointossResult = async (
  actionUuid: string,
  inboxId: string,
  result: "heads" | "tails",
  win: boolean,
) => {
  const dm = await client.conversations.newDm(inboxId);
  const message: MiniAppContent = {
    type: "action",
    manifest,
    action: uiCointossResult(actionUuid, win, result),
  };
  await dm.send(message, ContentTypeMiniApp);
};
