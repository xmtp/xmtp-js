import { ContentTypeMiniApp } from "@xmtp/content-type-mini-app";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { DecodedMessage } from "@xmtp/node-sdk";
import { startCointoss } from "./actions/cointoss";
import { play } from "./actions/play";
import { registrationSuccess, startRegistration } from "./actions/register";
import { welcomeUser } from "./actions/welcome";
import { isRegistered, players } from "./data";

export const processMessage = async (message: DecodedMessage) => {
  if (message.contentType?.sameAs(ContentTypeMiniApp)) {
    // TODO: Process mini app
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
