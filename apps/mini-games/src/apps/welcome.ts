import type { UIAction } from "@xmtp/content-type-mini-app";
import { getPlayerName } from "../data";

export const uiWelcome = (uuid: string, inboxId?: string): UIAction => {
  const name = inboxId ? getPlayerName(inboxId) : undefined;
  return {
    type: "ui",
    payload: {
      uuid,
      root: {
        type: "layout",
        props: {
          layout: "column",
          gap: "xs",
          padding: "md",
          children: [
            {
              type: "text",
              props: {
                text: name
                  ? `Welcome back to the XMTP MiniGames app, ${name}!`
                  : "Welcome to the XMTP MiniGames app!",
              },
            },
            {
              type: "text",
              props: {
                text: name
                  ? "Select a game to play!"
                  : "To get started, you need to register a name.",
              },
            },
            !name
              ? {
                  type: "button",
                  props: {
                    label: "Register",
                    action: {
                      type: "data",
                      payload: {
                        type: "action",
                        action: "register",
                      },
                    },
                  },
                }
              : {
                  type: "layout",
                  props: {
                    layout: "row",
                    gap: "xs",
                    children: [
                      {
                        type: "button",
                        props: {
                          label: "Play Coin Toss",
                          action: {
                            type: "data",
                            payload: {
                              type: "action",
                              action: "cointoss",
                            },
                          },
                        },
                      },
                    ],
                  },
                },
          ],
        },
      },
    },
  };
};
