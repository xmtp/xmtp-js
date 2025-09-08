import type { Request, Response } from "express";
import { z } from "zod";
import { createNotificationClient } from "@/notifications/client";

// Schema for unregistration
const unregisterRequestParamsSchema = z.object({
  installationId: z.string(),
});

type UnregisterRequestParams = z.infer<typeof unregisterRequestParamsSchema>;

const notificationClient = createNotificationClient();

export async function unregisterInstallation(
  req: Request<UnregisterRequestParams>,
  res: Response,
) {
  try {
    const { installationId } = unregisterRequestParamsSchema.parse(req.params);

    // 2. Delete from XMTP notification server
    await notificationClient.deleteInstallation({
      installationId,
    });

    res.status(200).send("Installation unregistered successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    console.error({ error }, "Failed to unregister installation");
    res.status(500).json({ error: "Failed to delete installation" });
  }
}
