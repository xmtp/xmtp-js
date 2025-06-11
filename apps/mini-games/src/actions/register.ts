import {
  ContentTypeMiniApp,
  type MiniAppContent,
} from "@xmtp/content-type-mini-app";
import { v4 } from "uuid";
import { uiRegister, uiRegisterSuccess } from "../apps/register";
import { client } from "../client";
import { actions, players } from "../data";
import { manifest } from "../manifest";

export const register = (inboxId: string, name: string) => {
  players.set(inboxId, { inboxId, name });
};

export const startRegistration = async (inboxId: string) => {
  const dm = await client.conversations.newDm(inboxId);
  const uuid = v4();
  actions.set(uuid, { uuid, type: "register", completed: false });
  const message: MiniAppContent = {
    type: "action",
    manifest,
    action: uiRegister(uuid),
  };
  await dm.send(message, ContentTypeMiniApp);
};

export const registrationSuccess = async (inboxId: string, name: string) => {
  const dm = await client.conversations.newDm(inboxId);
  const uuid = v4();
  const message: MiniAppContent = {
    type: "action",
    manifest,
    action: uiRegisterSuccess(uuid, name),
  };
  await dm.send(message, ContentTypeMiniApp);
};
