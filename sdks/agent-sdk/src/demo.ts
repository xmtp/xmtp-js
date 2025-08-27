import { ReplyCodec } from "@xmtp/content-type-reply";
import { Agent } from "./core";
import { createSigner, createUser, filter as f, withFilter } from "./utils";

const user = createUser();
const signer = createSigner(user);

const agent = await Agent.create(signer, {
  codecs: [new ReplyCodec()],
  dbPath: null,
  env: "dev",
});

agent.on("message", (ctx) => {
  ctx.conversation.send("First message!");
});

agent.on(
  "message",
  withFilter(f.and(f.notFromSelf, f.textOnly), (ctx) => {
    ctx.conversation.send("Goodbye!");
    agent.stop();
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
  const address = agent.client.accountIdentifier?.identifier;
  const env = agent.client.options?.env;
  const url = `http://xmtp.chat/dm/${address}?env=${env}`;
  console.log(`We are online: ${url}`);
});

agent.start();
