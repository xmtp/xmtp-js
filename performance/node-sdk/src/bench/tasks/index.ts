import type { Client, Signer } from "@xmtp/node-sdk";
import * as createClient from "./createClient";
import * as syncAll from "./syncAll";

type Task<Data = any> = {
  variations: string[];
  setup: (variation: string) => Promise<Data>;
  run: (data: Data) => Promise<void>;
};

export const tasks: Record<string, Task> = {
  createClient: createClient as Task<Signer>,
  syncAll: syncAll as Task<Client>,
} as const;

export type TaskName = keyof typeof tasks;
