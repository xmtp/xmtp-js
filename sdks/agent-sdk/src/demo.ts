import { loadEnvFile } from "node:process";
import { TextCodec } from "@xmtp/content-type-text";
import { downloadRemoteAttachment } from "@/util/AttachmentUtil.js";
import { Agent, AgentError } from "./core/index.js";
import { getTestUrl, logDetails } from "./debug/log.js";
import { isHexString } from "./index.js";
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

agent.on("attachment", async (ctx) => {
  const receivedAttachment = await downloadRemoteAttachment(
    ctx.message.content,
    agent,
  );
  console.log(`Received attachment: ${receivedAttachment.filename}`);
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

agent.on("transaction-reference", (ctx) => {
  const { networkId, reference } = ctx.message.content;
  if (!isHexString(reference)) {
    console.warn(`Invalid transaction ID: ${reference}`);
  }
  console.log(`Transaction "${reference}" on network "${networkId}".`);
});

agent.on("wallet-send-calls", (ctx) => {
  const { chainId, calls } = ctx.message.content;
  console.log(
    `Wallet request for "${calls.length}" calls on chain "${chainId}".`,
  );
});

agent.on("read-receipt", (ctx) => {
  console.log(`Message ID "${ctx.message.id}" was read.`);
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

agent.on("group", async (ctx) => {
  await ctx.sendMarkdown("**Hello, World!**");
});

await agent.start();
console.log("Agent has started.");
await logDetails(agent);

const resolveName = createNameResolver(process.env.WEB3BIO_API_KEY);
console.log(await resolveName("vitalik.eth"));
