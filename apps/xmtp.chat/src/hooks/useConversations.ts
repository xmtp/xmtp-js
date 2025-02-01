import type {
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { useClient } from "./useClient";

export const useConversations = () => {
  const { client } = useClient();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const list = async (
    options?: SafeListConversationsOptions,
    syncFromNetwork: boolean = false,
  ) => {
    if (!client) {
      return;
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
      const conversation = await client.conversations.newGroup(
        members,
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
      const conversation = await client.conversations.newDm(member);
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
