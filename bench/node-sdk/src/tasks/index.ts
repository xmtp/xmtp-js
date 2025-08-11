import type { Signer } from "@xmtp/node-sdk";
import * as createClient from "./createClient";

type Task<Data = any> = {
  variations: string[];
  setup: (variation: string) => Promise<Data>;
  run: (data: Data) => Promise<void>;
};

export const tasks = {
  "Client.create": createClient as Task<Signer>,
} as const satisfies Record<string, Task>;

export type TaskName = keyof typeof tasks;
