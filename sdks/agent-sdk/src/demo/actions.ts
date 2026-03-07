import { ActionWizard } from "@/middleware/ActionWizard";
import { getAgent } from "./getAgent";

const agent = await getAgent();

const wizard = new ActionWizard("api-setup", { dm: true, cancel: true })
  .select("provider", {
    description: "Select your API provider",
    actions: [
      { id: "railway", label: "Railway" },
      { id: "render", label: "Render.com" },
      { id: "vercel", label: "Vercel" },
    ],
  })
  .text("username", {
    description: "Enter your API username:",
  })
  .text("apiKey", {
    description: "Enter your API key:",
  })
  .onComplete(async (answers, ctx) => {
    await ctx.conversation.sendText(
      `Setup complete!\n` +
        `Provider ID: ${answers.provider}\n` +
        `Username: ${answers.username}\n` +
        `API Key: ${answers.apiKey}`,
    );
  })
  .onCancel(async (ctx) => {
    await ctx.conversation.sendText("Setup cancelled.");
  });

agent.use(wizard.middleware());

await agent.start();
