import {
  Button,
  Checkbox,
  Flex,
  FocusTrap,
  Popover,
  Stack,
  Tooltip,
  useMatches,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { IconInfoCircle, IconSettings } from "@tabler/icons-react";
import React from "react";
import { NetworkSelect } from "./NetworkSelect";

export const Settings: React.FC = () => {
  const [checked, setChecked] = useLocalStorage({
    key: "XMTP_USE_EPHEMERAL_ACCOUNT",
    defaultValue: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.currentTarget.checked);
  };

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
            <Flex gap="xs" align="center">
              <Checkbox
                checked={checked}
                onChange={handleChange}
                label="Use ephemeral account"
              />
              <Tooltip
                multiline
                w={260}
                label="A private key is generated and stored in the browser's local storage for reuse. To generate a new account, clear the local storage."
                withArrow
                events={{ hover: true, focus: true, touch: true }}>
                <IconInfoCircle tabIndex={0} size={20} stroke={1.2} />
              </Tooltip>
            </Flex>
            <NetworkSelect />
          </Stack>
        </FocusTrap>
      </Popover.Dropdown>
    </Popover>
  );
};
