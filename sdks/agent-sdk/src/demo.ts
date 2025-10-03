import { loadEnvFile } from "node:process";
import { TextCodec } from "@xmtp/content-type-text";
import { Agent, AgentError } from "./core/index.js";
import { getTestUrl } from "./debug/log.js";
import { CommandRouter } from "./middleware/CommandRouter.js";
import { createNameResolver } from "./user.js";
import { createSigner, createUser } from "./user/User.js";

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

agent.on("start", (ctx) => {
  console.log(`We are online: ${getTestUrl(ctx.client)}`);
});

agent.on("stop", (ctx) => {
  console.log("Agent stopped", ctx);
});

agent.on("unknownMessage", (ctx) => {
  // Narrow down by codec
  if (ctx.usesCodec(TextCodec)) {
    const content = ctx.message.content;
    console.log(`Text content: ${content.toUpperCase()}`);
  }
});

await agent.start();
console.log("Agent has started.");

const resolveName = createNameResolver(process.env.WEB3BIO_API_KEY);
console.log(await resolveName("vitalik.eth"));
