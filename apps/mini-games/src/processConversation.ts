import type { Dm, Group } from "@xmtp/node-sdk";
import { welcomeConversation } from "./actions/welcome";
import type { ContentTypes } from "./data";

export const processConversation = async (
  conversation: Group<ContentTypes> | Dm<ContentTypes>,
) => {
  await welcomeConversation(conversation);
};
