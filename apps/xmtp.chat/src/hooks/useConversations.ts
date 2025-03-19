import type {
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { useXMTP } from "@/contexts/XMTPContext";

export const useConversations = () => {
  const { client } = useXMTP();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const list = async (
    options?: SafeListConversationsOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (!client) {
      return [];
    }

    if (syncFromNetwork) {
      await sync();
    }

    setLoading(true);

    try {
      const convos = await client.conversations.list(options);
      return convos;
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    if (!client) {
      return;
    }

    setSyncing(true);

    try {
      await client.conversations.sync();
    } finally {
      setSyncing(false);
    }
  };

  const getConversationById = async (conversationId: string) => {
    if (!client) {
      return;
    }

    setLoading(true);

    try {
      const conversation =
        await client.conversations.getConversationById(conversationId);
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const getMessageById = async (messageId: string) => {
    if (!client) {
      return;
    }

    setLoading(true);

    try {
      const message = await client.conversations.getMessageById(messageId);
      return message;
    } finally {
      setLoading(false);
    }
  };

  const newGroup = async (
    members: string[],
    options: SafeCreateGroupOptions,
  ) => {
    if (!client) {
      return;
    }

    setLoading(true);

    try {
      const conversation = await client.conversations.newGroupWithIdentifiers(
        members.map((member) => ({
          identifier: member.toLowerCase(),
          identifierKind: "Ethereum",
        })),
        options,
      );
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  const newDm = async (member: string) => {
    if (!client) {
      return;
    }

    setLoading(true);

    try {
      const conversation = await client.conversations.newDmWithIdentifier({
        identifier: member.toLowerCase(),
        identifierKind: "Ethereum",
      });
      return conversation;
    } finally {
      setLoading(false);
    }
  };

  return {
    getConversationById,
    getMessageById,
    list,
    loading,
    newDm,
    newGroup,
    sync,
    syncing,
  };
};
