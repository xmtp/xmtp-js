import Dexie, { type EntityTable } from "dexie";

export type ActionEntity = {
  uuid: string;
  completed: boolean;
};

export const db = new Dexie("__XMTP_MINI_APP_DB__") as Dexie & {
  actions: EntityTable<ActionEntity, "uuid">;
};

db.version(1).stores({
  actions: "uuid, completed",
});

export const actions = db.table<ActionEntity>("actions");

export const getAction = async (uuid: string) => {
  return actions.where("uuid").equals(uuid).first();
};

export const setActionCompleted = async (uuid: string, completed: boolean) => {
  await actions.put({ uuid, completed });
};
