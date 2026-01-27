import { Box, Button, Group, Text } from "@mantine/core";
import { Modal } from "@/components/Modal";
import { useXMTP } from "@/contexts/XMTPContext";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";

export type AppLockModalProps = {
  opened: boolean;
  onClose: () => void;
  onDisconnect: () => void;
};

export const AppLockModal: React.FC<AppLockModalProps> = ({
  opened,
  onClose,
  onDisconnect,
}) => {
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;
  const { releaseLock } = useXMTP();
  const { setAutoConnect } = useSettings();

  const footer = (
    <Group justify="flex-end" flex={1} p="md">
      <Button
        variant="default"
        onClick={() => {
          onClose();
          setAutoConnect(false);
          releaseLock();
          onDisconnect();
        }}>
        Disconnect other session
      </Button>
      <Button onClick={onClose}>OK</Button>
    </Group>
  );

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened={opened}
      centered
      fullScreen={fullScreen}
      onClose={onClose}
      size="sm"
      padding={0}>
      <ContentLayout
        title="xmtp.chat session active"
        maxHeight={contentHeight}
        footer={footer}
        withScrollFade={false}
        withScrollAreaPadding={false}>
        <Box p="md">
          <Text mb="md">
            This app is active in another browser tab or window. Close or
            disconnect that session, or use this instance instead.
          </Text>
        </Box>
      </ContentLayout>
    </Modal>
  );
};
