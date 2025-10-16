import { Box, Button, Group, NativeSelect } from "@mantine/core";
import { ConsentState } from "@xmtp/browser-sdk";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate, useOutletContext } from "react-router";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversation } from "@/hooks/useConversation";
import { ContentLayout } from "@/layouts/ContentLayout";
import type { ConversationOutletContext } from "./ConversationOutletContext";

export const ManageConsentModal: React.FC = () => {
  const { conversationId } = useOutletContext<ConversationOutletContext>();
  const { conversation } = useConversation(conversationId);
  const navigate = useNavigate();
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;
  const initialConsentState = useRef<ConsentState>(ConsentState.Unknown);
  const [consentState, setConsentState] = useState<ConsentState>(
    ConsentState.Unknown,
  );
  const [consentStateLoading, setConsentStateLoading] = useState(false);

  useEffect(() => {
    const loadConsentState = async () => {
      const consentState = await conversation.consentState();
      initialConsentState.current = consentState;
      setConsentState(consentState);
    };
    void loadConsentState();
  }, [conversation.id]);

  const handleClose = useCallback(() => {
    void navigate(`/conversations/${conversation.id}`);
  }, [navigate, conversation.id]);

  const handleConsentStateChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = parseInt(event.currentTarget.value, 10) as ConsentState;
      setConsentState(newValue);
    },
    [conversation.id],
  );

  const handleConsentStateUpdate = useCallback(async () => {
    setConsentStateLoading(true);
    try {
      await conversation.updateConsentState(consentState);
      handleClose();
    } finally {
      setConsentStateLoading(false);
    }
  }, [conversation.id, consentState, handleClose]);

  const footer = useMemo(() => {
    return (
      <Group justify="flex-end" flex={1} p="md">
        <Button variant="default" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="filled"
          disabled={consentState === initialConsentState.current}
          loading={consentStateLoading}
          onClick={() => void handleConsentStateUpdate()}>
          Save
        </Button>
      </Group>
    );
  }, [consentState, handleConsentStateUpdate]);

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="xs"
      padding={0}>
      <ContentLayout
        title="Manage consent"
        maxHeight={contentHeight}
        footer={footer}
        withScrollFade={false}
        withScrollAreaPadding={false}>
        <Box p="md">
          <NativeSelect
            size="sm"
            disabled={consentStateLoading}
            value={consentState}
            onChange={(event) => {
              handleConsentStateChange(event);
            }}
            data={[
              { value: "0", label: "Unknown" },
              { value: "1", label: "Allowed" },
              { value: "2", label: "Denied" },
            ]}
          />
        </Box>
      </ContentLayout>
    </Modal>
  );
};
