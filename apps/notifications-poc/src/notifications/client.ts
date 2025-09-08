import { create } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { type HmacKey } from "@xmtp/node-sdk";
import {
  Notifications,
  Subscription_HmacKeySchema,
  SubscriptionSchema,
  type Subscription,
} from "@/notifications/gen/notifications/v1/service_pb";

export function createNotificationClient() {
  if (!process.env.NOTIFICATION_SERVER_URL) {
    throw new Error("NOTIFICATION_SERVER_URL is not set");
  }
  const transport = createConnectTransport({
    baseUrl: process.env.NOTIFICATION_SERVER_URL,
    httpVersion: "1.1",
  });
  return createClient(Notifications, transport);
}

export type Topic = {
  topic: string;
  hmacKeys: HmacKey[];
};

export type NotificationResponse = {
  idempotency_key: string;
  message: {
    content_topic: string;
    timestamp_ns: string;
    message: string;
  };
  message_context: {
    message_type: string;
    should_push?: boolean;
  };
  installation: {
    id: string;
    delivery_mechanism: {
      kind: string;
      token: string;
    };
  };
  subscription: {
    created_at: string;
    topic: string;
    is_silent: boolean;
  };
};

export async function subscribeToTopics(
  // The installationId we want to apply the subscription to
  installationId: string,
  // A notifications server client, like the one generated above.
  notificationClient: ReturnType<typeof createNotificationClient>,
  topics: Topic[],
) {
  // convert topics to subscriptions
  const subscriptions = topics.map(
    (topic): Subscription =>
      create(SubscriptionSchema, {
        topic: topic.topic,
        isSilent: false,
        hmacKeys: topic.hmacKeys.map((v) =>
          create(Subscription_HmacKeySchema, {
            thirtyDayPeriodsSinceEpoch: Number(v.epoch),
            key: Uint8Array.from(v.key),
          }),
        ),
      }),
  );

  await notificationClient.subscribeWithMetadata({
    installationId,
    subscriptions,
  });
}
