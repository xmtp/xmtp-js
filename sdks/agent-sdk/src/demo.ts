import { loadEnvFile } from "node:process";
import { Agent } from "./core/index.js";
import { CommandRouter } from "./middleware/CommandRouter.js";
import { getTestUrl } from "./utils/debug.js";
import { AgentError, createSigner, createUser } from "./utils/index.js";

try {
  loadEnvFile(".env");
  console.info(`Loaded keys from ".env" file.`);
} catch {}

const agent = process.env.XMTP_WALLET_KEY
  ? await Agent.createFromEnv()
  : await Agent.create(createSigner(createUser()), {
      dbPath: null,
    });

const router = new CommandRouter();

router.command("/version", async (ctx) => {
  await ctx.conversation.send(`v${process.env.npm_package_version}`);
});

agent.use(router.middleware());

agent.on("attachment", (ctx) => {
  console.log("Got attachment:", ctx.message.content);
});

agent.on("text", (ctx) => {
  console.log("Got text:", ctx.message.content);
});

agent.on("reaction", (ctx) => {
  console.log("Got reaction:", ctx.message.content);
});

agent.on("reply", (ctx) => {
  console.log("Got reply:", ctx.message.content);
});

agent.on("text", async (ctx) => {
  if (ctx.message.content.startsWith("@agent")) {
    await ctx.conversation.send("How can I help you?");
  }
});

const errorHandler = (error: unknown) => {
  if (error instanceof AgentError) {
    console.log(`Caught error ID "${error.code}"`, error);
    console.log("Original error", error.cause);
  } else {
    console.log(`Caught error`, error);
  }
};

agent.on("unhandledError", errorHandler);

agent.on("start", () => {
  console.log(`We are online: ${getTestUrl(agent)}`);
});

void agent.start();
