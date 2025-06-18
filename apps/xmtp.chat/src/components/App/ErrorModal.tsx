import { Box, Button, Group, Tabs } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { CodeWithCopy } from "@/components/CodeWithCopy";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ErrorModal: React.FC = () => {
  const [unhandledRejectionError, setUnhandledRejectionError] =
    useState<Error | null>(null);
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setUnhandledRejectionError(event.reason as Error);
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  const footer = useMemo(() => {
    return (
      <Group justify="space-between" flex={1} p="md">
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
    );
  }, []);

  return unhandledRejectionError ? (
    <Modal
      opened={!!unhandledRejectionError}
      onClose={() => {
        setUnhandledRejectionError(null);
      }}
      fullScreen={fullScreen}
      closeOnEscape={false}
      closeOnClickOutside={false}
      withCloseButton={false}
      padding={0}
      centered>
      <ContentLayout
        title="Application error"
        maxHeight={contentHeight}
        footer={footer}
        withScrollFade={false}
        withScrollAreaPadding={false}>
        <Box p="md">
          <Tabs defaultValue="message">
            <Tabs.List>
              <Tabs.Tab value="message">Message</Tabs.Tab>
              <Tabs.Tab value="stackTrace">Stack trace</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="message" py="md">
              <CodeWithCopy code={unhandledRejectionError.message} />
            </Tabs.Panel>
            <Tabs.Panel value="stackTrace" py="md">
              <CodeWithCopy
                code={
                  unhandledRejectionError.stack ?? "Stack trace not available"
                }
              />
            </Tabs.Panel>
          </Tabs>
        </Box>
      </ContentLayout>
    </Modal>
  ) : null;
};
