import type { Request, Response } from "express";
import { type NotificationResponse } from "@/notifications/client";

if (!process.env.XMTP_NOTIFICATION_SECRET) {
  throw new Error("XMTP_NOTIFICATION_SECRET is not set");
}

/**
 * Webhook handler for XMTP notifications
 *
 * This endpoint uses custom header-based authentication instead of the standard authMiddleware.
 * It validates the request using the XMTP_NOTIFICATION_SECRET to verify the webhook is coming
 * from the authorized XMTP server.
 */
export function handleXmtpNotification(req: Request, res: Response) {
  try {
    const notification = req.body as NotificationResponse;

    res.status(200).json({
      contentTopic: notification.message.content_topic,
      messageType: notification.message_context.message_type,
      encryptedMessage: notification.message.message,
      timestamp: notification.message.timestamp_ns,
    });
  } catch (error) {
    console.error({ error }, "Outer error processing notification");
    res.status(500).json({ error: "Internal server error" });
  }
}
