import { Box, Button, Group, TextInput } from "@mantine/core";
import { type Conversation } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "@/components/Modal";
import type { ContentTypes } from "@/contexts/XMTPContext";
import { isValidEthereumAddress } from "@/helpers/strings";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversations } from "@/hooks/useConversations";
import { useMemberId } from "@/hooks/useMemberId";
import { ContentLayout } from "@/layouts/ContentLayout";

export const CreateDmModal: React.FC = () => {
  const { newDm, newDmWithIdentifier } = useConversations();
  const [loading, setLoading] = useState(false);
  const { memberId, setMemberId, error: memberIdError } = useMemberId();
  const navigate = useNavigate();
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  const handleClose = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  const handleCreate = async () => {
    setLoading(true);

    try {
      let conversation: Conversation<ContentTypes>;

      if (isValidEthereumAddress(memberId)) {
        conversation = await newDmWithIdentifier({
          identifier: memberId,
          identifierKind: "Ethereum",
        });
      } else {
        conversation = await newDm(memberId);
      }

      void navigate(`/conversations/${conversation.id}`);
    } finally {
      setLoading(false);
    }
  };

  const footer = useMemo(() => {
    return (
      <Group justify="flex-end" flex={1} p="md">
        <Button variant="default" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="filled"
          disabled={loading || memberIdError !== null}
          loading={loading}
          onClick={() => void handleCreate()}>
          Create
        </Button>
      </Group>
    );
  }, [handleClose, handleCreate, loading]);

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="600"
      padding={0}>
      <ContentLayout
        title="Create direct message"
        maxHeight={contentHeight}
        footer={footer}
        withScrollAreaPadding={false}>
        <Box p="md">
          <TextInput
            size="sm"
            label="Address or inbox ID"
            styles={{
              label: {
                marginBottom: "var(--mantine-spacing-xxs)",
              },
            }}
            error={memberIdError}
            value={memberId}
            onChange={(event) => {
              setMemberId(event.target.value);
            }}
          />
        </Box>
      </ContentLayout>
    </Modal>
  );
};
