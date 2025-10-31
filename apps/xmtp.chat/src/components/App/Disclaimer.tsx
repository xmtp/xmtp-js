import { Button, Group, Text } from "@mantine/core";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";

export const Disclaimer: React.FC = () => {
  const { showDisclaimer, setShowDisclaimer } = useSettings();
  const fullScreen = useCollapsedMediaQuery();

  return (
    <Modal
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      fullScreen={fullScreen}
      opened={showDisclaimer}
      onClose={() => {
        setShowDisclaimer(false);
      }}
      padding={0}>
      <ContentLayout
        title="Disclaimer"
        footer={
          <Group align="center" justify="center" w="100%" p="md">
            <Button
              onClick={() => {
                setShowDisclaimer(false);
              }}>
              I understand
            </Button>
          </Group>
        }
        withScrollArea={false}
        withScrollFade={false}
        withScrollAreaPadding={false}>
        <Text p="md">
          XMTP has no token or airdrop and will never ask you for funds. Anyone
          making such claims—even if they appear official—is attempting to
          defraud you. Be cautious when messaging with unknown addresses.
        </Text>
      </ContentLayout>
    </Modal>
  );
};
