import { Box, Button, Space, Text } from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import type { EthSignTypedDataParams } from "@xmtp/content-type-eth-sign-typed-data";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import { useCallback } from "react";
import { useOutletContext } from "react-router";
import { useChainId, useSignTypedData, useSwitchChain } from "wagmi";

export type EthSignTypedDataContentProps = {
  content: EthSignTypedDataParams;
  conversationId: string;
};

export const EthSignTypedDataContent: React.FC<
  EthSignTypedDataContentProps
> = ({ content, conversationId }) => {
  const { client } = useOutletContext<{ client: Client }>();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
  const wagmiChainId = useChainId();

  const handleSubmit = useCallback(async () => {
    if (content.domain?.chainId) {
      const chainId = Number(content.domain.chainId);
      if (chainId !== wagmiChainId) {
        console.log(
          `Current Chain Id (${wagmiChainId}) doesn't match; switching to Chain Id ${chainId}.`,
        );
        await switchChainAsync({ chainId });
        await new Promise((r) => setTimeout(r, 300)); // Metamask requires some delay
      }
    }
    const { metadata, account, ...actualTypedData } = content;
    console.log(actualTypedData);
    const signature = await signTypedDataAsync(actualTypedData, {
      onError(error) {
        console.error(error);
      },
    });
    const transactionReference: TransactionReference = {
      networkId: content.domain?.chainId ? Number(content.domain.chainId) : 1,
      reference: signature,
    };
    const conversation =
      await client.conversations.getConversationById(conversationId);
    if (!conversation) {
      console.error("Couldn't find conversation by Id");
      return;
    }
    await conversation.send(
      transactionReference,
      ContentTypeTransactionReference,
    );
  }, [content, signTypedDataAsync, client, conversationId]);

  return (
    <Box flex="flex">
      <Text size="sm">{content.metadata.description}</Text>
      <Space h="md" />
      <Button
        fullWidth
        onClick={(event) => {
          event.stopPropagation();
          void handleSubmit();
        }}>
        Submit
      </Button>
    </Box>
  );
};
