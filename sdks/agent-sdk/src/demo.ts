import { Client } from "@xmtp/node-sdk";
import { Agent } from "./core";
import { filters } from "./filters";
import { createSigner, createUser } from "./utils";

const user = createUser();
const signer = createSigner(user);
const client = await Client.create(signer, {
  env: "dev",
});
const agent = new Agent({ client });

agent.on("message", async (ctx) => {
  ctx.conversation.send("Hello!");
});

agent.on(
  "message",
  async (ctx) => {
    ctx.conversation.send("Hey!");
  },
  filters.and(filters.notFromSelf, filters.textOnly),
);

agent.on("start", () => {});

console.log(agent.eventNames());

// TODO: Overload remaining public API of EventEmitter
// Pass down signer + options, do Client.create in Agent constr.
