import { Button, Group } from "@mantine/core";
import { GroupPermissionsOptions, Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import {
  defaultPolicySet,
  Permissions,
  processPermissionsUpdate,
} from "@/components/Conversation/Permissions";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversation } from "@/hooks/useConversation";
import { ContentLayout } from "@/layouts/ContentLayout";
import type { PolicySet } from "@/types";

export const ManagePermissionsModal: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsPolicy, setPermissionsPolicy] =
    useState<GroupPermissionsOptions>(GroupPermissionsOptions.Default);
  const [policySet, setPolicySet] = useState<PolicySet>(defaultPolicySet);

  const { conversationId } = useOutletContext<ConversationOutletContext>();
  const { conversation } = useConversation(conversationId);
  const navigate = useNavigate();

  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  const handleClose = useCallback(() => {
    void navigate(`/conversations/${conversation.id}`);
  }, [navigate, conversation.id]);

  const handleUpdate = useCallback(async () => {
    if (!(conversation instanceof XmtpGroup)) {
      return;
    }
    setIsLoading(true);
    try {
      await processPermissionsUpdate(
        conversation,
        permissionsPolicy,
        policySet,
      );
      void navigate(`/conversations/${conversation.id}`);
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id, permissionsPolicy, policySet, navigate]);

  const footer = useMemo(() => {
    return (
      <Group justify="flex-end" flex={1} p="md">
        <Button variant="default" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="filled"
          disabled={isLoading}
          loading={isLoading}
          onClick={() => void handleUpdate()}>
          Save
        </Button>
      </Group>
    );
  }, [isLoading, handleUpdate]);

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="auto"
      padding={0}>
      <ContentLayout
        title="Manage permissions"
        maxHeight={contentHeight}
        footer={footer}
        withScrollAreaPadding={false}>
        <Permissions
          conversation={conversation}
          onPermissionsPolicyChange={setPermissionsPolicy}
          onPolicySetChange={setPolicySet}
        />
      </ContentLayout>
    </Modal>
  );
};
