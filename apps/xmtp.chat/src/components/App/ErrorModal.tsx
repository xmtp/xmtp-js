import { Button, Group, Modal, ScrollArea, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { CodeWithCopy } from "@/components/CodeWithCopy";

export const ErrorModal: React.FC = () => {
  const [unhandledRejectionError, setUnhandledRejectionError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setUnhandledRejectionError(
        (event.reason as Error).message || "Unknown error",
      );
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return unhandledRejectionError ? (
    <Modal
      opened={!!unhandledRejectionError}
      onClose={() => {
        setUnhandledRejectionError(null);
      }}
      withCloseButton={false}
      centered>
      <Stack gap="md">
        <Title order={4}>Application error</Title>
        <ScrollArea>
          <CodeWithCopy
            code={JSON.stringify(unhandledRejectionError, null, 2)}
          />
        </ScrollArea>
        <Group justify="space-between">
          <Button
            variant="default"
            component="a"
            href="https://github.com/xmtp/xmtp-js/issues/new/choose"
            target="_blank">
            Report issue
          </Button>
          <Button
            onClick={() => {
              setUnhandledRejectionError(null);
            }}>
            OK
          </Button>
        </Group>
      </Stack>
    </Modal>
  ) : null;
};
