import type { Dm, Group } from "@xmtp/node-sdk";
import { welcomeConversation } from "./actions/welcome";

export const processConversation = async (conversation: Group | Dm) => {
  await welcomeConversation(conversation);
};
