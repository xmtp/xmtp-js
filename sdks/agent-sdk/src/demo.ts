import { loadEnvFile } from "node:process";
import { Agent, AgentError } from "./core/index.js";
import { CommandRouter } from "./middleware/CommandRouter.js";
import { getTestUrl } from "./utils/debug.js";
import { createSigner, createUser } from "./utils/user.js";

try {
  loadEnvFile(".env");
  console.info(`Loaded keys from ".env" file.`);
} catch {}

const agent = process.env.XMTP_WALLET_KEY
  ? await Agent.createFromEnv()
  : await Agent.create(createSigner(createUser()), {
      dbPath: null,
    });

type AgentContentTypes = typeof agent extends Agent<infer T> ? T : never;
const router = new CommandRouter<AgentContentTypes>();

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

agent.on("start", (ctx) => {
  console.log(`We are online: ${getTestUrl(ctx.agent)}`);
});

agent.on("stop", (ctx) => {
  console.log("Agent stopped", ctx);
});

await agent.start();
console.log("Agent has started.");

const dm = await agent.createDmWithAddress(
  "0xa03369f8065ece3d490f3fa0517a22e8767b6f72",
);
dm.send("Hey Benny!");
