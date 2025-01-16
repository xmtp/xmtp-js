import { Button, FocusTrap, Popover, Stack, useMatches } from "@mantine/core";
import React, { useEffect, useRef } from "react";
import { IconSettings } from "../icons/IconSettings";
import { DisableAnalytics } from "./DisableAnalytics";
import { LoggingSelect } from "./LoggingSelect";
import { NetworkSelect } from "./NetworkSelect";
import { useRefManager } from "./RefManager";
import { UseEphemeralAccountOption } from "./UseEphemeralAccountOption";

export const Settings: React.FC = () => {
  const { setRef } = useRefManager();
  const ref = useRef<HTMLButtonElement>(null);
  const label: React.ReactNode = useMatches({
    base: <IconSettings size={24} />,
    sm: "Settings",
  });

  useEffect(() => {
    setRef("settings-button", ref);
  }, []);

  const px = useMatches({
    base: "xs",
    sm: "md",
  });

  return (
    <Popover position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Button variant="default" aria-label="Settings" px={px} ref={ref}>
          {label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <FocusTrap>
          <Stack gap="md" align="flex-end" p="xs">
            <UseEphemeralAccountOption />
            <NetworkSelect />
            <LoggingSelect />
            <DisableAnalytics />
          </Stack>
        </FocusTrap>
      </Popover.Dropdown>
    </Popover>
  );
};
