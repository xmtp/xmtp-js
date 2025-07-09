import { Box, CheckIcon, Group, Text } from "@mantine/core";
import { useCallback } from "react";
import classes from "./AccountCard.module.css";

export type AccountCardProps = {
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  selected?: boolean;
};

export const AccountCard: React.FC<AccountCardProps> = ({
  disabled,
  icon,
  label,
  onClick,
  selected,
}) => {
  const classNames = [classes.root];
  if (disabled) {
    classNames.push(classes.disabled);
  }
  if (selected) {
    classNames.push(classes.selected);
  }

  const handleClick = useCallback(() => {
    if (!disabled && !selected) {
      onClick?.();
    }
  }, [disabled, selected, onClick]);

  return (
    <Group
      align="center"
      p="md"
      gap="md"
      className={classNames.join(" ")}
      tabIndex={0}
      pos="relative"
      onClick={handleClick}>
      {icon}
      <Text size="lg" flex={1} c={disabled ? "dimmed" : "inherit"}>
        {label}
      </Text>
      {selected && (
        <Box pos="absolute" right="var(--mantine-spacing-md)" w={20}>
          <CheckIcon />
        </Box>
      )}
    </Group>
  );
};
