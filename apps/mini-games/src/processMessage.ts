import {
  ContentTypeMiniApp,
  type MiniAppContent,
} from "@xmtp/content-type-mini-app";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { DecodedMessage } from "@xmtp/node-sdk";
import {
  playCointoss,
  sendCointossStats,
  startCointoss,
} from "./actions/cointoss";
import { play } from "./actions/play";
import {
  register,
  registrationSuccess,
  startRegistration,
} from "./actions/register";
import { welcomeUser } from "./actions/welcome";
import { isRegistered, players, type MiniGamesResponseData } from "./data";

export const processMessage = async (message: DecodedMessage) => {
  if (message.contentType?.sameAs(ContentTypeMiniApp)) {
    const content = message.content as MiniAppContent;
    if (content.type === "response") {
      try {
        const data = content.data as MiniGamesResponseData;
        switch (data.type) {
          case "register":
            if (!isRegistered(message.senderInboxId)) {
              register(message.senderInboxId, data.name);
            }
            await registrationSuccess(message.senderInboxId, data.name);
            break;
          case "action":
            switch (data.action) {
              case "cointoss":
                if (!isRegistered(message.senderInboxId)) {
                  await startRegistration(message.senderInboxId);
                  return;
                }
                await startCointoss(message.senderInboxId);
                break;
              case "cointoss-stats":
                if (!isRegistered(message.senderInboxId)) {
                  await startRegistration(message.senderInboxId);
                  return;
                }
                await sendCointossStats(message.senderInboxId);
                break;
              case "play":
                if (!isRegistered(message.senderInboxId)) {
                  await startRegistration(message.senderInboxId);
                  return;
                }
                await play(message.senderInboxId);
                break;
              case "register":
                await startRegistration(message.senderInboxId);
                break;
            }
            break;
          case "cointoss":
            if (!isRegistered(message.senderInboxId)) {
              await startRegistration(message.senderInboxId);
              return;
            }
            await playCointoss(content.uuid, message.senderInboxId, data.move);
            break;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  if (message.contentType?.sameAs(ContentTypeText)) {
    const text = message.content as string;
    switch (text) {
      case "/cointoss":
        if (!isRegistered(message.senderInboxId)) {
          await startRegistration(message.senderInboxId);
          return;
        }
        await startCointoss(message.senderInboxId);
        break;
      case "/help":
        await welcomeUser(message.senderInboxId);
        break;
      case "/register":
        if (isRegistered(message.senderInboxId)) {
          const player = players.get(message.senderInboxId);
          await registrationSuccess(
            message.senderInboxId,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            player!.name,
          );
        } else {
          await startRegistration(message.senderInboxId);
        }
        break;
      case "/play":
        if (!isRegistered(message.senderInboxId)) {
          await startRegistration(message.senderInboxId);
          return;
        }
        await play(message.senderInboxId);
        break;
    }
  }
};
