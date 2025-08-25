import { Client } from "@xmtp/node-sdk";
import { Agent } from "./core";
import { filters } from "./filters";
import { createSigner, createUser } from "./utils";

const user = createUser();
const signer = createSigner(user);
const client = await Client.create(signer, {
  env: "dev",
});
// Pass down signer + options, do Client.create in Agent constructor (needs wrapping in getClient() as these calls are async)
const agent = new Agent({ client });

agent.on("message", async (ctx) => {
  await ctx.conversation.send("Hello!");
});

agent.on(
  "message",
  async (ctx) => {
    await ctx.conversation.send("Hey!");
  },
  filters.and(filters.notFromSelf, filters.textOnly),
);

agent.on("message", (ctx) => {
  console.log("Got message:", ctx.message.content);
});

const errorHandler = (error: unknown) => {
  console.log("Caught error", error);
};

agent.off("error", errorHandler);

agent.on("start", () => {
  console.log(`We are online!`);
});
