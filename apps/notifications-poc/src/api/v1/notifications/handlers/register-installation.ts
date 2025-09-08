import type { Request, Response } from "express";
import { z } from "zod";
import { createNotificationClient } from "@/notifications/client";

const registerInstallationRequestSchema = z.object({
  installationId: z.string(),
});

export type ICurrentRegisterInstallationRequestBody = z.infer<
  typeof registerInstallationRequestSchema
>;

const notificationClient = createNotificationClient();

export async function registerInstallation(
  req: Request<unknown, unknown, ICurrentRegisterInstallationRequestBody>,
  res: Response,
) {
  const currentParseResult = registerInstallationRequestSchema.safeParse(
    req.body,
  );
  if (currentParseResult.success) {
    await handleCurrentRegistration({
      req,
      res,
      body: currentParseResult.data,
    });
    return;
  }

  res.status(400).json({ error: "Invalid request body" });
}

async function handleCurrentRegistration(args: {
  req: Request<unknown, unknown, ICurrentRegisterInstallationRequestBody>;
  res: Response;
  body: ICurrentRegisterInstallationRequestBody;
}) {
  const { res, body } = args;

  try {
    const installationId = body.installationId;
    // Register the new installations with XMTP

    try {
      const response = await notificationClient.registerInstallation({
        installationId,
        deliveryMechanism: {
          deliveryMechanismType: {
            case: "customToken",
            value: "test",
          },
        },
      });
      res.status(201).json({
        status: "success" as const,
        installationId,
        validUntil: Number(response.validUntil),
      });
      return;
    } catch (regError) {
      console.error(
        { error: regError, installationId },
        "Failed to register installation with XMTP server",
      );
      return {
        status: "error" as const,
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error({ error }, "Failed to register installation");
    res.status(500).json({ error: "Failed to register installation" });
  }
}
