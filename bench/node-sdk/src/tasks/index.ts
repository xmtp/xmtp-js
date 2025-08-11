import { run, setup } from "./createClient";

export const tasks: Record<
  string,
  { setup: () => any; run: (...args: any[]) => Promise<any> }
> = {
  createClient: { setup, run },
};

export type TaskName = keyof typeof tasks;
export type Task<T extends TaskName> = (typeof tasks)[T];
