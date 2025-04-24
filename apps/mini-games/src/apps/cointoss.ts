import type { UIAction } from "@xmtp/content-type-mini-app";

export const uiCointossPlay = (uuid: string): UIAction => {
  return {
    type: "ui",
    payload: {
      uuid,
      root: {
        type: "stack-layout",
        props: {
          gap: "xs",
          padding: "md",
          children: [
            {
              type: "text",
              props: {
                text: "Welcome to Coin Toss! Choose heads or tails to start playing.",
              },
            },
            {
              type: "row-layout",
              props: {
                gap: "xs",
                children: [
                  {
                    type: "button",
                    props: {
                      label: "Heads",
                      action: {
                        type: "data",
                        payload: {
                          type: "cointoss",
                          move: "heads",
                        },
                      },
                    },
                  },
                  {
                    type: "button",
                    props: {
                      label: "Tails",
                      action: {
                        type: "data",
                        payload: {
                          type: "cointoss",
                          move: "tails",
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

export const uiCointossResult = (
  uuid: string,
  win: boolean,
  result: "heads" | "tails",
): UIAction => {
  return {
    type: "ui",
    payload: {
      uuid,
      root: {
        type: "stack-layout",
        props: {
          gap: "xs",
          padding: "md",
          children: [
            {
              type: "text",
              props: {
                text: `The coin landed on ${result}`,
              },
            },
            {
              type: "text",
              props: {
                bold: true,
                text: win ? "You win!" : "You lose!",
              },
            },
            {
              type: "row-layout",
              props: {
                gap: "xs",
                children: [
                  {
                    type: "button",
                    props: {
                      label: "Play again",
                      action: {
                        type: "data",
                        payload: {
                          type: "action",
                          action: "cointoss",
                        },
                      },
                    },
                  },
                  {
                    type: "button",
                    props: {
                      label: "Play another game",
                      action: {
                        type: "data",
                        payload: {
                          type: "action",
                          action: "play",
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
