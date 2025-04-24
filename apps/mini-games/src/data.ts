type Game = {
  type: "cointoss";
  uuid: string;
  result: "heads" | "tails";
  player: string;
  move: "heads" | "tails";
  groupId: string;
  createdAt: number;
};

type Player = {
  inboxId: string;
  name: string;
};

type Action = {
  uuid: string;
  type: "register" | "cointoss" | "welcome";
  completed: boolean;
};

export const games = new Map<string, Game>();
export const players = new Map<string, Player>();
export const actions = new Map<string, Action>();

export const isRegistered = (inboxId: string) => {
  return players.has(inboxId);
};

export const getPlayerName = (inboxId: string) => {
  return players.get(inboxId)?.name;
};
