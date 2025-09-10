import type { HmacKey } from "@xmtp/node-sdk";
import { createNotificationClient } from "../notifications/client";

const notificationClient = createNotificationClient();

export const register = async (installationId: string) => {
  return notificationClient.registerInstallation({
    installationId,
    deliveryMechanism: {
      deliveryMechanismType: {
        case: "customToken",
        value: "test",
      },
    },
  });
};

export const unregister = async (installationId: string) => {
  return notificationClient.deleteInstallation({
    installationId,
  });
};

export const subscribe = async (
  installationId: string,
  topic: string,
  hmacKeys: HmacKey[],
) => {
  return notificationClient.subscribeWithMetadata({
    installationId,
    subscriptions: [
      {
        topic,
        isSilent: false,
        hmacKeys: hmacKeys.map(({ epoch, key }) => ({
          thirtyDayPeriodsSinceEpoch: Number(epoch),
          key,
        })),
      },
    ],
  });
};

export const unsubscribe = async (installationId: string, topic: string) => {
  return notificationClient.unsubscribe({
    installationId,
    topics: [topic],
  });
};
