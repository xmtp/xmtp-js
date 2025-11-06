import { Button, Divider, Stack, Text } from "@mantine/core";
import { useNavigate } from "react-router";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";

export const SelectConversation = () => {
  const navigate = useNavigate();
  const { environment } = useSettings();
  return (
    <ContentLayout title="No conversation selected">
      <Stack gap="lg" align="center" py="xl">
        <Text>
          Select a conversation in the left sidebar to display its messages.
        </Text>
        <Divider
          label="or"
          w="80%"
          styles={{
            label: {
              fontSize: "var(--mantine-font-size-md)",
              color: "var(--mantine-color-text)",
            },
          }}
        />
        <Stack gap="xs">
          <Button
            size="xs"
            onClick={() => {
              void navigate(`/${environment}/conversations/new-group`);
            }}>
            Create a new group
          </Button>
          <Button
            size="xs"
            onClick={() => {
              void navigate(`/${environment}/conversations/new-dm`);
            }}>
            Create a new direct message
          </Button>
        </Stack>
      </Stack>
    </ContentLayout>
  );
};
