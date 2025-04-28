import type { UIAction } from "@xmtp/content-type-mini-app";
import { getCointossPlayerStats } from "../data";

export const uiCointossPlay = (uuid: string): UIAction => {
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
              type: "layout",
              props: {
                layout: "column",
                gap: "xs",
                children: [
                  {
                    type: "text",
                    props: {
                      bold: true,
                      text: "Welcome to Coin Toss!",
                    },
                  },
                  {
                    type: "text",
                    props: {
                      text: "Choose heads or tails to start playing.",
                    },
                  },
                ],
              },
            },
            {
              type: "layout",
              props: {
                layout: "row",
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
        type: "layout",
        props: {
          layout: "column",
          gap: "xs",
          padding: "md",
          children: [
            {
              type: "text",
              props: {
                text: `The coin landed on ${result}.`,
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
              type: "layout",
              props: {
                layout: "row",
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
                      label: "Stats",
                      action: {
                        type: "data",
                        payload: {
                          type: "action",
                          action: "cointoss-stats",
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

export const uiCointossStats = (uuid: string, inboxId: string): UIAction => {
  const { totalGames, totalWins, winPercentage } =
    getCointossPlayerStats(inboxId);
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
                bold: true,
                text: "Coin Toss Stats",
              },
            },
            {
              type: "layout",
              props: {
                layout: "column",
                gap: "4",
                children: [
                  {
                    type: "text",
                    props: {
                      text: `Total games played: ${totalGames}`,
                    },
                  },
                  {
                    type: "text",
                    props: {
                      text: `Total wins: ${totalWins}`,
                    },
                  },
                  {
                    type: "text",
                    props: {
                      text: `Win percentage: ${winPercentage}%`,
                    },
                  },
                ],
              },
            },
            {
              type: "layout",
              props: {
                layout: "row",
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
