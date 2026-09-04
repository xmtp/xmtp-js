import { beforeEach, describe, expect, it } from "vitest";
import { inboxStore } from "@/stores/inbox/store";

type InboxStoreState = ReturnType<typeof inboxStore.getState>;
type ConversationArg = Parameters<InboxStoreState["addConversation"]>[0];

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe("inboxStore", () => {
  beforeEach(() => {
    inboxStore.getState().reset();
  });

  it("preserves concurrent conversation updates that finish out of order", async () => {
    const firstMembers = deferred<unknown[]>();
    const firstLastMessage = deferred<undefined>();
    const secondMembers = deferred<unknown[]>();
    const secondLastMessage = deferred<undefined>();

    const firstConversation = {
      id: "conversation-a",
      createdAtNs: 1n,
      members: () => firstMembers.promise,
      lastMessage: () => firstLastMessage.promise,
    } as unknown as ConversationArg;
    const secondConversation = {
      id: "conversation-b",
      createdAtNs: 2n,
      members: () => secondMembers.promise,
      lastMessage: () => secondLastMessage.promise,
    } as unknown as ConversationArg;

    const firstUpdate = inboxStore
      .getState()
      .addConversation(firstConversation);
    const secondUpdate = inboxStore
      .getState()
      .addConversation(secondConversation);

    secondMembers.resolve([{ inboxId: "member-b" }]);
    await Promise.resolve();
    secondLastMessage.resolve(undefined);
    await secondUpdate;

    firstMembers.resolve([{ inboxId: "member-a" }]);
    await Promise.resolve();
    firstLastMessage.resolve(undefined);
    await firstUpdate;

    const state = inboxStore.getState();
    expect(Array.from(state.conversations.keys()).sort()).toEqual([
      "conversation-a",
      "conversation-b",
    ]);
    expect(state.members.get("conversation-a")?.has("member-a")).toBe(true);
    expect(state.members.get("conversation-b")?.has("member-b")).toBe(true);
    expect(state.lastMessages.has("conversation-a")).toBe(true);
    expect(state.lastMessages.has("conversation-b")).toBe(true);
  });
});
