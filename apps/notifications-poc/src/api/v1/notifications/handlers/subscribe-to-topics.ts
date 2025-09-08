import type { Request, Response } from "express";
import { hexToUint8Array } from "uint8array-extras";
import { z } from "zod";
import { createNotificationClient } from "@/notifications/client";

// Schema for subscription without optional metadata
const subscribeRequestBodySchema = z.object({
  installationId: z.string(),
  topics: z.array(z.string()),
});

// Schema for subscription with optional metadata
const subscribeWithMetadataRequestBodySchema = z.object({
  installationId: z.string(),
  subscriptions: z.array(
    z.object({
      topic: z.string(),
      isSilent: z.boolean().optional().default(false),
      hmacKeys: z.array(
        z.object({
          thirtyDayPeriodsSinceEpoch: z.number(),
          key: z.string(),
        }),
      ),
    }),
  ),
});

type SubscribeWithMetadataRequestBody = z.infer<
  typeof subscribeWithMetadataRequestBodySchema
>;

const notificationClient = createNotificationClient();

export async function subscribeToTopics(
  req: Request<unknown, unknown, SubscribeWithMetadataRequestBody>,
  res: Response,
) {
  try {
    // first check if the request body is a simple subscribe request
    // if parsing fails, check if the request body is a subscribe with metadata request
    try {
      const validatedData = subscribeRequestBodySchema.parse(req.body);
      await notificationClient.subscribe({
        installationId: validatedData.installationId,
        topics: validatedData.topics,
      });
      res.status(200).send();
      return;
    } catch (error) {
      // request was for a simple subscribe, but the client failed to subscribe
      if (!(error instanceof z.ZodError)) {
        res.status(500).json({ error: "Failed to subscribe to topics" });
        return;
      }
    }

    const validatedData = subscribeWithMetadataRequestBodySchema.parse(
      req.body,
    );

    // convert the HMAC keys to Uint8Array from hex strings
    const subscriptions = validatedData.subscriptions.map((sub) => ({
      ...sub,
      hmacKeys: sub.hmacKeys.map((key) => ({
        ...key,
        key: hexToUint8Array(key.key),
      })),
    }));

    await notificationClient.subscribeWithMetadata({
      installationId: validatedData.installationId,
      subscriptions,
    });

    res.status(200).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    res.status(500).json({ error: "Failed to subscribe to topics" });
  }
}
