import { loadEnvFile } from "node:process";
import { downloadRemoteAttachment } from "@/util/AttachmentUtil";
import { Agent, AgentError } from "./core/index";
import { getTestUrl, logDetails } from "./debug/log";
import { isHexString } from "./index";
import { CommandRouter } from "./middleware/CommandRouter";
import { createNameResolver } from "./user";
import { createSigner, createUser } from "./user/User";

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
  await ctx.conversation.sendText(`v${process.env.npm_package_version}`);
});

router.command("/test-actions", async (ctx) => {
  await ctx.conversation.sendActions({
    id: `actions-${Date.now()}`,
    description: "Would you like to proceed?",
    actions: [
      { id: "action-yes", label: "Yes" },
      { id: "action-no", label: "No" },
    ],
  });
});

agent.use(router.middleware());

agent.on("attachment", async (ctx) => {
  const receivedAttachment = await downloadRemoteAttachment(
    ctx.message.content,
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

agent.on("intent", async (ctx) => {
  const { actionId } = ctx.message.content;
  console.log("Got intent:", ctx.message.content);
  await ctx.conversation.sendText(`You selected action ID "${actionId}".`);
});

agent.on("text", async (ctx) => {
  if (ctx.message.content.startsWith("@agent")) {
    await ctx.conversation.sendText("How can I help you?");
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
  console.log(
    `Unknown message type, displaying fallback content: ${ctx.message.fallback}`,
  );
});

agent.on("group", async (ctx) => {
  await ctx.conversation.sendMarkdown("**Hello, World!**");
});

await agent.start();
console.log("Agent has started.");
await logDetails(agent);

const resolveName = createNameResolver(process.env.WEB3BIO_API_KEY);
console.log(await resolveName("vitalik.eth"));
