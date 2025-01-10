import type {
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
} from "@xmtp/browser-sdk";
import { useState } from "react";
import { ClientNotFoundError } from "../helpers/errors";
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
      throw new ClientNotFoundError("fetching conversations");
    }

    if (syncFromNetwork) {
      setLoading(true);
      await sync();
      setLoading(false);
    }

    const convos = await client.conversations.list(options);
    return convos;
  };

  const sync = async () => {
    if (!client) {
      throw new ClientNotFoundError("syncing conversations");
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
      throw new ClientNotFoundError("fetching a conversation by ID");
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
      throw new ClientNotFoundError("fetching a message by ID");
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
      throw new ClientNotFoundError("creating a new group");
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
      throw new ClientNotFoundError("creating a new DM");
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
