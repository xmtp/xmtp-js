import { Flags } from "@oclif/core";
import {
  DeliveryStatus,
  GroupMessageKind,
  type ListMessagesOptions,
} from "@xmtp/node-sdk";
import { contentTypeMap, contentTypeOptions } from "./contentType.js";

const deliveryStatusMap: Record<string, DeliveryStatus> = {
  unpublished: DeliveryStatus.Unpublished,
  published: DeliveryStatus.Published,
  failed: DeliveryStatus.Failed,
};

const kindMap: Record<string, GroupMessageKind> = {
  application: GroupMessageKind.Application,
  "membership-change": GroupMessageKind.MembershipChange,
};

export const messageFilterFlags = {
  "sent-before": Flags.string({
    description: "Filter by sent before timestamp (nanoseconds)",
    helpValue: "<ns>",
  }),
  "sent-after": Flags.string({
    description: "Filter by sent after timestamp (nanoseconds)",
    helpValue: "<ns>",
  }),
  "inserted-before": Flags.string({
    description: "Filter by local DB insertion before timestamp (nanoseconds)",
    helpValue: "<ns>",
  }),
  "inserted-after": Flags.string({
    description: "Filter by local DB insertion after timestamp (nanoseconds)",
    helpValue: "<ns>",
  }),
  "delivery-status": Flags.option({
    options: ["unpublished", "published", "failed"] as const,
    description: "Filter by delivery status",
  })(),
  kind: Flags.option({
    options: ["application", "membership-change"] as const,
    description: "Filter by message kind",
  })(),
  "content-type": Flags.option({
    options: contentTypeOptions,
    description: "Filter by content type (repeatable)",
    multiple: true,
  })(),
  "exclude-content-type": Flags.option({
    options: contentTypeOptions,
    description: "Exclude content type (repeatable)",
    multiple: true,
  })(),
  "exclude-sender": Flags.string({
    description: "Exclude messages from sender inbox ID (repeatable)",
    multiple: true,
  }),
};

export type MessageFilterFlagValues = {
  "sent-before"?: string;
  "sent-after"?: string;
  "inserted-before"?: string;
  "inserted-after"?: string;
  "delivery-status"?: string;
  kind?: string;
  "content-type"?: string[];
  "exclude-content-type"?: string[];
  "exclude-sender"?: string[];
};

export function buildMessageFilterOptions(
  flags: MessageFilterFlagValues,
  parseBigInt: (
    value: string | undefined,
    flagName: string,
  ) => bigint | undefined,
): Omit<ListMessagesOptions, "limit" | "direction"> {
  const options: Omit<ListMessagesOptions, "limit" | "direction"> = {};

  const sentBeforeNs = parseBigInt(flags["sent-before"], "sent-before");
  if (sentBeforeNs !== undefined) {
    options.sentBeforeNs = sentBeforeNs;
  }

  const sentAfterNs = parseBigInt(flags["sent-after"], "sent-after");
  if (sentAfterNs !== undefined) {
    options.sentAfterNs = sentAfterNs;
  }

  const insertedBeforeNs = parseBigInt(
    flags["inserted-before"],
    "inserted-before",
  );
  if (insertedBeforeNs !== undefined) {
    options.insertedBeforeNs = insertedBeforeNs;
  }

  const insertedAfterNs = parseBigInt(
    flags["inserted-after"],
    "inserted-after",
  );
  if (insertedAfterNs !== undefined) {
    options.insertedAfterNs = insertedAfterNs;
  }

  if (flags["delivery-status"]) {
    options.deliveryStatus = deliveryStatusMap[flags["delivery-status"]];
  }

  if (flags.kind) {
    options.kind = kindMap[flags.kind];
  }

  if (flags["content-type"]?.length) {
    options.contentTypes = flags["content-type"].map(
      (ct) => contentTypeMap[ct],
    );
  }

  if (flags["exclude-content-type"]?.length) {
    options.excludeContentTypes = flags["exclude-content-type"].map(
      (ct) => contentTypeMap[ct],
    );
  }

  if (flags["exclude-sender"]?.length) {
    options.excludeSenderInboxIds = flags["exclude-sender"];
  }

  return options;
}
