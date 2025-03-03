import { Button } from "@mantine/core";
import type { Conversation } from "@xmtp/browser-sdk";
import {
  ContentTypeTransactionReference,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { useSendTransaction } from "wagmi";

export type WalletSendCallsProps = {
  content: WalletSendCallsParams;
  sendMessage: Conversation["send"];
};

export const WalletSendCallsUI: React.FC<WalletSendCallsProps> = ({
  content,
  sendMessage,
}) => {
  const { sendTransaction } = useSendTransaction();

  function handleSubmit() {
    content.calls.forEach((call) => {
      const wagmiTxData = {
        ...call,
        value: BigInt(parseInt(call.value || "0x0", 16)),
        chainId: parseInt(content.chainId, 16),
      };
      sendTransaction(wagmiTxData, {
        onError(error) {
          if (error.name === "TransactionExecutionError") {
            console.error(error);
          }
        },
        onSuccess(txHash) {
          const transactionReference: TransactionReference = {
            networkId: content.chainId,
            reference: txHash,
          };
          void sendMessage(
            transactionReference,
            ContentTypeTransactionReference,
          );
        },
      });
    });
  }

  return (
    <div>
      Review the following transactions:
      <br />
      {content.calls.map((call) => (
        <p>{call.metadata?.description}</p>
      ))}
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
};
