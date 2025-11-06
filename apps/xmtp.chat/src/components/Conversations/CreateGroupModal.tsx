import { Accordion, Badge, Button, Group, Stack, Text } from "@mantine/core";
import { GroupPermissionsOptions } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { PendingMember } from "@/components/Conversation/AddMembers";
import { Members } from "@/components/Conversation/Members";
import { Metadata } from "@/components/Conversation/Metadata";
import {
  defaultPolicySet,
  Permissions,
} from "@/components/Conversation/Permissions";
import { Modal } from "@/components/Modal";
import { isValidEthereumAddress, isValidInboxId } from "@/helpers/strings";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversations } from "@/hooks/useConversations";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";
import { useActions } from "@/stores/inbox/hooks";
import type { PolicySet } from "@/types";

const permissionsPolicyValue = (policy: GroupPermissionsOptions) => {
  switch (policy) {
    case GroupPermissionsOptions.Default:
      return "Default";
    case GroupPermissionsOptions.AdminOnly:
      return "Admin only";
    case GroupPermissionsOptions.CustomPolicy:
      return "Custom policy";
  }
};

export const CreateGroupModal: React.FC = () => {
  const { newGroup } = useConversations();
  const { addConversation } = useActions();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrlSquare, setImageUrlSquare] = useState("");
  const [addedMembers, setAddedMembers] = useState<PendingMember[]>([]);
  const [permissionsPolicy, setPermissionsPolicy] =
    useState<GroupPermissionsOptions>(GroupPermissionsOptions.Default);
  const [policySet, setPolicySet] = useState<PolicySet>(defaultPolicySet);
  const navigate = useNavigate();
  const { environment } = useSettings();
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  const handleClose = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  const handleCreate = useCallback(async () => {
    setLoading(true);

    try {
      const addedMemberInboxIds = addedMembers
        .filter((member) => isValidInboxId(member.inboxId))
        .map((member) => member.inboxId);
      const conversation = await newGroup(addedMemberInboxIds, {
        name,
        description,
        imageUrlSquare,
        permissions: permissionsPolicy,
        customPermissionPolicySet:
          permissionsPolicy === GroupPermissionsOptions.CustomPolicy
            ? policySet
            : undefined,
      });

      const addedMemberAddresses = addedMembers
        .filter((member) => isValidEthereumAddress(member.address))
        .map((member) => member.address);
      if (addedMemberAddresses.length > 0) {
        await conversation.addMembersByIdentifiers(
          addedMemberAddresses.map((address) => ({
            identifier: address.toLowerCase(),
            identifierKind: "Ethereum",
          })),
        );
      }

      // ensure conversation is added to store so navigation works
      await addConversation(conversation);
      void navigate(`/${environment}/conversations/${conversation.id}`);
    } finally {
      setLoading(false);
    }
  }, [
    newGroup,
    addConversation,
    navigate,
    environment,
    name,
    description,
    imageUrlSquare,
    permissionsPolicy,
    policySet,
    addedMembers,
  ]);

  const footer = useMemo(() => {
    return (
      <Group justify="flex-end" flex={1} p="md">
        <Button variant="default" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="filled"
          disabled={loading}
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
        title="Create group"
        maxHeight={contentHeight}
        footer={footer}
        withScrollAreaPadding={false}>
        <Stack gap="sm" py="md">
          <Accordion
            defaultValue="metadata"
            variant="separated"
            px="md"
            styles={{
              content: {
                padding: 0,
              },
            }}>
            <Accordion.Item value="metadata">
              <Accordion.Control>
                <Text fw="bold">Metadata</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Metadata
                  onNameChange={setName}
                  onDescriptionChange={setDescription}
                  onImageUrlChange={setImageUrlSquare}
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          <Accordion
            variant="separated"
            px="md"
            styles={{
              content: {
                padding: 0,
              },
            }}>
            <Accordion.Item value="members">
              <Accordion.Control>
                <Group justify="space-between" align="center" pr="md">
                  <Text fw="bold">Members</Text>
                  <Badge color="gray" size="lg">
                    {addedMembers.length}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Members
                  addedMembers={addedMembers}
                  onMembersAdded={setAddedMembers}
                  existingMembers={[]}
                  removedMembers={[]}
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          <Accordion
            variant="separated"
            px="md"
            styles={{
              content: {
                padding: 0,
              },
            }}>
            <Accordion.Item value="permissions">
              <Accordion.Control>
                <Group justify="space-between" align="center" pr="md">
                  <Text fw="bold">Permissions</Text>
                  <Badge color="gray" size="lg">
                    {permissionsPolicyValue(permissionsPolicy)}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Permissions
                  onPermissionsPolicyChange={setPermissionsPolicy}
                  onPolicySetChange={setPolicySet}
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </ContentLayout>
    </Modal>
  );
};
