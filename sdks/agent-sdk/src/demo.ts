import { loadEnvFile } from "node:process";
import { Agent } from "./core/index.js";
import { CommandRouter } from "./middleware/CommandRouter.js";
import { f, withFilter } from "./utils/index.js";

loadEnvFile(".env");

const agent = await Agent.create();

const router = new CommandRouter();

router.command("/version", async (ctx) => {
  await ctx.conversation.send(`v${process.env.npm_package_version}`);
});

agent.use(router.middleware());

agent.on("message", (ctx) => {
  void ctx.conversation.send("First message!");
});

agent.on(
  "message",
  withFilter(f.and(f.notFromSelf, f.textOnly), (ctx) => {
    void ctx.conversation.send("Goodbye!");
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

void agent.start();
