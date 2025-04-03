import { Box, Button, List, Space, Text } from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { useCallback } from "react";
import { useOutletContext } from "react-router";
import { useChainId, useSendTransaction, useSwitchChain } from "wagmi";

export type WalletSendCallsContentProps = {
  content: WalletSendCallsParams;
  conversationId: string;
};

export const WalletSendCallsContent: React.FC<WalletSendCallsContentProps> = ({
  content,
  conversationId,
}) => {
  const { client } = useOutletContext<{ client: Client }>();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const wagmiChainId = useChainId();

  const handleSubmit = useCallback(async () => {
    const chainId = parseInt(content.chainId, 16);
    if (chainId !== wagmiChainId) {
      console.log(
        `Current Chain Id (${wagmiChainId}) doesn't match; switching to Chain Id ${chainId}.`,
      );
      await switchChainAsync({ chainId });
      await new Promise((r) => setTimeout(r, 300)); // Metamask requires some delay
    }
    for (const call of content.calls) {
      const wagmiTxData = {
        ...call,
        value: BigInt(parseInt(call.value || "0x0", 16)),
        chainId,
        gas: call.gas ? BigInt(parseInt(call.gas, 16)) : undefined,
      };
      const txHash = await sendTransactionAsync(wagmiTxData, {
        onError(error) {
          console.error(error);
        },
      });
      const transactionReference: TransactionReference = {
        networkId: content.chainId,
        reference: txHash,
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
    }
  }, [content, sendTransactionAsync, client, conversationId]);

  return (
    <Box flex="flex">
      <Text size="sm">Review the following transactions:</Text>
      <List size="sm">
        {content.calls.map((call) => (
          <List.Item>{call.metadata?.description}</List.Item>
        ))}
      </List>
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
