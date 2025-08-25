import { ReplyCodec } from "@xmtp/content-type-reply";
import { Agent } from "./core";
import { filters } from "./filters";
import { createSigner, createUser } from "./utils";

const user = createUser();
const signer = createSigner(user);
// Create agent (content types inferred from codecs)
const agent = await Agent.create({
  signer,
  options: {
    env: "dev",
    codecs: [new ReplyCodec()],
  },
});

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

agent.on("error", errorHandler);

agent.off("error", errorHandler);

agent.on("start", () => {
  console.log(`We are online!`);
});
