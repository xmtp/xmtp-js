import { Box, Button, List, Space, Text } from "@mantine/core";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { useCallback } from "react";
import { useOutletContext } from "react-router";
import { useSendTransaction } from "wagmi";
import type { ConversationOutletContext } from "../Conversation/ConversationOutletContext";

export type WalletSendCallsProps = {
  content: WalletSendCallsParams;
};

export const WalletSendCallsUI: React.FC<WalletSendCallsProps> = ({
  content,
}) => {
  const { conversation } = useOutletContext<ConversationOutletContext>();
  const { sendTransactionAsync } = useSendTransaction();

  const handleSubmit = useCallback(() => {
    void (async () => {
      for (const call of content.calls) {
        const wagmiTxData = {
          ...call,
          value: BigInt(parseInt(call.value || "0x0", 16)),
          chainId: parseInt(content.chainId, 16),
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
        await conversation.send(
          transactionReference,
          ContentTypeTransactionReference,
        );
      }
    })();
  }, [content, sendTransactionAsync, conversation]);

  return (
    <Box flex="flex">
      <Text size="sm">Review the following transactions:</Text>
      <List size="sm">
        {content.calls.map((call) => (
          <List.Item>{call.metadata?.description}</List.Item>
        ))}
      </List>
      <Space h="md" />
      <Button fullWidth onClick={handleSubmit}>
        Submit
      </Button>
    </Box>
  );
};
