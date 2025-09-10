import { Router, type Request, type Response } from "express";
import { type NotificationResponse } from "@/notifications/client";
import { handleEncryptedMessage } from "@/utils/xmtp";

/**
 * Webhook handler for XMTP notifications
 *
 * This endpoint uses custom header-based authentication instead of the standard authMiddleware.
 * It validates the request using the XMTP_NOTIFICATION_SECRET to verify the webhook is coming
 * from the authorized XMTP server.
 */
function handleXmtpNotification(req: Request, res: Response) {
  try {
    const notification = req.body as NotificationResponse;

    void handleEncryptedMessage(notification.message);

    res.status(200).end();
  } catch (error) {
    console.error({ error }, "Outer error processing notification");
    res.status(500).json({ error: "Internal server error" });
  }
}

const apiRouter = Router();

apiRouter.post("/handle-notification", handleXmtpNotification);

export default apiRouter;
