import { ReplyCodec } from "@xmtp/content-type-reply";
import { Agent } from "./core";
import { createSigner, createUser, filter as f, withFilter } from "./utils";

const user = createUser();
const signer = createSigner(user);
// Create agent (content types inferred from codecs)
const agent = await Agent.create(signer, {
  env: "dev",
  codecs: [new ReplyCodec()],
});

agent.on("message", (ctx) => {
  void ctx.conversation.send("Hello!");
});

agent.on(
  "message",
  withFilter(f.and(f.notFromSelf, f.textOnly), (ctx) => {
    void ctx.conversation.send("Hey!");
  }),
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
