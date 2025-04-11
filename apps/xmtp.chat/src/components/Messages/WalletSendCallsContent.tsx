import { Box, Button, List, Space, Text } from "@mantine/core";
import type { Client } from "@xmtp/browser-sdk";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import {
  useCapabilities,
  useSendCalls,
  useWaitForCallsStatus,
} from "wagmi/experimental";

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
  const wagmiAccount = useAccount();
  const { sendCalls } = useSendCalls();
  const [callsId, setCallsId] = useState<string>();
  const { data: callsStatus } = useWaitForCallsStatus({
    id: callsId,
    query: {
      enabled: !!callsId,
    },
  });
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const { switchChainAsync } = useSwitchChain();
  const wagmiChainId = useChainId();
  type OptionalCapability = { supported: boolean } | undefined;
  const { data: availableCapabilities } = useCapabilities();

  const isBatchingSupported = (txChainId: number): boolean => {
    return !!(
      availableCapabilities &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Necessary because Viem type definition is bad and availableCapabilities is {} in case of an EOA wallet.
      (availableCapabilities[txChainId]?.atomicBatch as OptionalCapability)
    )?.supported;
  };

  useEffect(() => {
    if (!callsStatus?.receipts) return;
    // Exactly one receipt is expected since sendCalls is used only when atomic batching is supported
    const receipt = callsStatus.receipts[0];
    setTxHash(receipt.transactionHash);
  }, [callsStatus?.status]);

  useEffect(() => {
    if (!txHash) return;
    void (async () => {
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
    })();
  }, [txHash]);

  const handleSubmit = useCallback(async () => {
    const chainId = parseInt(content.chainId, 16);
    if (chainId !== wagmiChainId) {
      console.log(
        `Current Chain Id (${wagmiChainId}) doesn't match; switching to Chain Id ${chainId}.`,
      );
      await switchChainAsync({ chainId });
      await new Promise((r) => setTimeout(r, 300)); // Metamask requires some delay
    }
    if (isBatchingSupported(chainId)) {
      sendCalls(
        {
          calls: content.calls,
          chainId,
        },
        {
          onSuccess({ id }) {
            setCallsId(id);
          },
          onError(error) {
            console.error(error);
          },
        },
      );
    } else {
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
        setTxHash(txHash);
      }
    }
  }, [
    content,
    sendTransactionAsync,
    client,
    conversationId,
    wagmiAccount.isConnected,
    wagmiAccount.connector,
  ]);

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
