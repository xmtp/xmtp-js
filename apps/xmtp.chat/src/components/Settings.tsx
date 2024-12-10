import { Button, FocusTrap, Popover, Stack, useMatches } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import React from "react";
import { LoggingSelect } from "./LoggingSelect";
import { NetworkSelect } from "./NetworkSelect";
import { UseEphemeralAccountOption } from "./UseEphemeralAccountOption";

export const Settings: React.FC = () => {
  const label: React.ReactNode = useMatches({
    base: <IconSettings stroke={1.5} />,
    sm: "Settings",
  });

  const px = useMatches({
    base: "xs",
    sm: "md",
  });

  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Button variant="default" aria-label="Settings" px={px}>
          {label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <FocusTrap>
          <Stack gap="md" align="flex-end" p="xs">
            <UseEphemeralAccountOption />
            <NetworkSelect />
            <LoggingSelect />
          </Stack>
        </FocusTrap>
      </Popover.Dropdown>
    </Popover>
  );
};
