import type { Request, Response } from "express";
import { z } from "zod";
import { createNotificationClient } from "@/notifications/client";

// Schema for unsubscription
const unsubscribeRequestBodySchema = z.object({
  installationId: z.string(),
  topics: z.array(z.string()),
});

type UnsubscribeRequestBody = z.infer<typeof unsubscribeRequestBodySchema>;

const notificationClient = createNotificationClient();

export async function unsubscribeFromTopics(
  req: Request<unknown, unknown, UnsubscribeRequestBody>,
  res: Response,
) {
  try {
    const validatedData = unsubscribeRequestBodySchema.parse(req.body);

    await notificationClient.unsubscribe({
      installationId: validatedData.installationId,
      topics: validatedData.topics,
    });

    res.status(200).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    res.status(500).json({ error: "Failed to unsubscribe from topics" });
  }
}
