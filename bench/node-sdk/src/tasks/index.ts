import * as createClient from "./createClient";
import * as createClientEphemeral from "./createClientEphemeral";

export const tasks = {
  "Client.create": {
    setup: createClient.setup,
    run: createClient.run,
  },
  "Client.create (ephemeral)": {
    setup: createClientEphemeral.setup,
    run: createClientEphemeral.run,
  },
};

export type TaskName = keyof typeof tasks;
export type Task<T extends TaskName> = (typeof tasks)[T];
