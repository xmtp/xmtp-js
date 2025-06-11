import { Box, Group, Image, Popover, Stack, Text } from "@mantine/core";
import type { ChromeComponent } from "@xmtp/content-type-mini-app";
import { useMiniAppContext } from "@xmtp/content-type-mini-app/react";
import type { FC } from "react";
import { IconInfo } from "@/icons/IconInfo";
import classes from "./Chrome.module.css";

export const Chrome: FC<ChromeComponent["props"]> = ({ manifest, root }) => {
  const { renderComponent } = useMiniAppContext();
  return (
    <Stack gap="0">
      <Group
        align="center"
        justify="space-between"
        gap="xs"
        p="xs"
        className={classes.header}>
        <Group gap="xs">
          {manifest.icon && (
            <Image
              src={manifest.icon}
              alt={manifest.author}
              title={manifest.author}
              w="24"
              h="24"
            />
          )}
          <Text size="sm" fw={700}>
            {manifest.name}
          </Text>
        </Group>
        <Popover position="top" withArrow shadow="md">
          <Popover.Target>
            <Box w="24" h="24" className={classes.info}>
              <IconInfo />
            </Box>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <Stack gap="0">
                <Group gap="xs" justify="space-between" align="center">
                  <Text size="sm" fw="bold">
                    {manifest.name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {manifest.version}
                  </Text>
                </Group>
                <Text size="sm">by {manifest.author}</Text>
              </Stack>
              <Text size="sm">{manifest.description}</Text>
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </Group>
      <Box className={classes.content}>{renderComponent(root)}</Box>
    </Stack>
  );
};
