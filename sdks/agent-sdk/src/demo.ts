import { loadEnvFile } from "node:process";
import { Agent } from "./core/index.js";
import { CommandRouter } from "./middleware/CommandRouter.js";
import { getTestUrl } from "./utils/debug.js";
import { createSigner, createUser, f, withFilter } from "./utils/index.js";

try {
  loadEnvFile(".env");
  console.info(`Loaded keys from ".env" file.`);
} catch {}

const agent = process.env.XMTP_WALLET_KEY
  ? await Agent.create()
  : await Agent.create(createSigner(createUser()), {
      dbPath: null,
    });

const router = new CommandRouter();

router.command("/version", async (ctx) => {
  await ctx.conversation.send(`v${process.env.npm_package_version}`);
});

agent.use(router.middleware());

agent.on("message", (ctx) => {
  console.log("Got message:", ctx.message.content);
});

agent.on(
  "message",
  withFilter(f.isText, async (ctx) => {
    await ctx.conversation.send("How can I help you?");
  }),
);

const errorHandler = (error: unknown) => {
  console.log("Caught error", error);
};

agent.on("error", errorHandler);

agent.off("error", errorHandler);

agent.on("start", () => {
  console.log(`We are online: ${getTestUrl(agent)}`);
});

void agent.start();
