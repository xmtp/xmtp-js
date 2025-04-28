import type { UIAction } from "@xmtp/content-type-mini-app";

export const uiRegister = (uuid: string): UIAction => {
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
                text: "Enter a name so it's easier to identify you.",
              },
            },
            {
              type: "input",
              props: {
                id: "name",
                label: "Name",
                type: "text",
              },
            },
            {
              type: "button",
              props: {
                label: "Register",
                action: {
                  type: "data",
                  payload: {
                    type: "register",
                    name: "#name",
                  },
                },
              },
            },
          ],
        },
      },
    },
  };
};

export const uiRegisterSuccess = (uuid: string, name: string): UIAction => {
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
                text: `Welcome ${name}, you're ready to play!`,
              },
            },
            {
              type: "button",
              props: {
                label: "Play",
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
    },
  };
};
