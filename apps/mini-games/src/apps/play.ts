import type { UIAction } from "@xmtp/content-type-mini-app";

export const uiPlay = (uuid: string): UIAction => {
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
                text: "Choose a game to play!",
              },
            },
            {
              type: "layout",
              props: {
                layout: "row",
                children: [
                  {
                    type: "button",
                    props: {
                      label: "Coin Toss",
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
