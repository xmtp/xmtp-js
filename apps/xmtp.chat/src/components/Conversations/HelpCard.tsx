import { Box, Card, Flex, Stack, Text } from "@mantine/core";
import { useNavigate } from "react-router";
import { HELP_ADDRESS } from "@/hooks/useHelpDm";
import { useSettings } from "@/hooks/useSettings";
import { IconHelp } from "@/icons/IconHelp";
import styles from "./HelpCard.module.css";

export const HelpCard: React.FC = () => {
  const navigate = useNavigate();
  const { environment } = useSettings();

  const handleClick = () => {
    void navigate(`/${environment}/dm/${HELP_ADDRESS}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleClick();
    }
  };

  return (
    <Box px="sm" pt="sm" className={styles.container}>
      <Card
        shadow="sm"
        padding="sm"
        radius="md"
        withBorder
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={styles.root}>
        <Stack gap="0">
          <Flex align="center" gap="xs">
            <IconHelp size={18} />
            <Text fw={700} truncate>
              Need development help?
            </Text>
          </Flex>
          <Text size="sm" c="dimmed">
            Chat with our AI assistant
          </Text>
        </Stack>
      </Card>
    </Box>
  );
};
