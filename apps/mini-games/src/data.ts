import type { ExtractCodecContentTypes } from "@xmtp/browser-sdk";
import type { MiniAppCodec } from "@xmtp/content-type-mini-app";

type Game = {
  type: "cointoss";
  uuid: string;
  result: "heads" | "tails";
  player: string;
  move: "heads" | "tails";
  groupId?: string;
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

export const getCointossPlayerStats = (inboxId: string) => {
  const playerGames = games
    .entries()
    .filter(([_id, game]) => game.player === inboxId)
    .toArray();

  const totalGames = playerGames.length;
  const totalWins = playerGames.filter(
    ([_id, game]) => game.move === game.result,
  ).length;
  const winPercentage = (totalWins / totalGames) * 100;

  return { totalGames, totalWins, winPercentage };
};

export type MiniGamesResponseData =
  | {
      type: "action";
      action: "cointoss" | "register" | "play" | "cointoss-stats";
    }
  | {
      type: "register";
      name: string;
    }
  | {
      type: "cointoss";
      move: "heads" | "tails";
    };

export type ContentTypes = ExtractCodecContentTypes<[MiniAppCodec]>;
