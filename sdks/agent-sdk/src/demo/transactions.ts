import { loadEnvFile } from "node:process";
import { validHex } from "@xmtp/node-sdk";
import { formatUnits, parseUnits } from "viem";
import { base } from "viem/chains";
import { Agent } from "@/core/index";
import { getTestUrl } from "@/debug/log";
import { CommandRouter } from "@/middleware/CommandRouter";
import {
  createERC20TransferCalls,
  getERC20Balance,
} from "@/util/TransactionUtil";

try {
  loadEnvFile();
  console.info(`Loaded keys from ".env" file.`);
} catch {}

const agent = await Agent.createFromEnv();
const CHAIN = base;
/** USDC Token address on Base chain: https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 */
const USDC_TOKEN_CONTRACT =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const USDC_DECIMALS = 6;

const router = new CommandRouter({ helpCommand: "/help" });

router.command("/my-balance", "Check your USDC balance", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  const senderBalance = await getERC20Balance({
    chain: CHAIN,
    tokenAddress: USDC_TOKEN_CONTRACT,
    address: validHex(senderAddress),
  });
  await ctx.conversation.sendText(
    `Your USDC balance is: ${formatUnits(senderBalance, USDC_DECIMALS)}`,
  );
});

router.command(
  "/your-balance",
  "Check the agent's USDC balance",
  async (ctx) => {
    const ownAddress = ctx.getClientAddress();
    const ownBalance = await getERC20Balance({
      chain: CHAIN,
      tokenAddress: USDC_TOKEN_CONTRACT,
      address: validHex(ownAddress),
    });
    await ctx.conversation.sendText(
      `My USDC balance is: ${formatUnits(ownBalance, USDC_DECIMALS)}`,
    );
  },
);

router.command("/tx", "Send USDC to the agent (e.g. /tx 0.1)", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  const receiverAddress = agent.address;
  const amount = parseUnits(ctx.message.content, USDC_DECIMALS);
  const currency = "USDC";

  const walletSendCalls = createERC20TransferCalls({
    chain: CHAIN,
    tokenAddress: USDC_TOKEN_CONTRACT,
    from: validHex(senderAddress),
    to: validHex(receiverAddress),
    amount,
    description: `Transfer "${ctx.message.content} ${currency}" on chain "${CHAIN.name}" to address "${receiverAddress}".`,
  });

  await ctx.conversation.sendWalletSendCalls(walletSendCalls);
  await ctx.conversation.sendText(
    "After completing the transaction, send a transaction reference to confirm.",
  );
});

agent.use(router.middleware());

agent.on("transaction-reference", async (ctx) => {
  const transactionReference = ctx.message.content;
  await ctx.conversation.sendText(
    `Transaction confirmed!\n` +
      `Network: ${transactionReference.networkId}\n` +
      `Hash: ${transactionReference.reference}`,
  );
});

agent.on("start", (ctx) => {
  console.log(`Address: ${agent.address}`);
  console.log(`Link: ${getTestUrl(ctx.client)}`);
  console.log("Agent started. Waiting for messages...");
});

await agent.start();
