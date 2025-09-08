import { Router } from "express";
import {
  notificationsRouter,
  xmtpNotificationsRouter,
} from "@/api/v1/notifications/notifications.router";

const v1Router = Router();

// mount xmtp notification webhook (no auth middleware)
v1Router.use("/notifications/xmtp", xmtpNotificationsRouter);

// mount notifications routes under /notifications
v1Router.use("/notifications", notificationsRouter);

export default v1Router;
