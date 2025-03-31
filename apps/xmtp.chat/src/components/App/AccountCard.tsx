import { Group, Text } from "@mantine/core";
import classes from "./AccountCard.module.css";

export type AccountCardProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
};

export const AccountCard: React.FC<AccountCardProps> = ({
  icon,
  label,
  onClick,
}) => {
  return (
    <Group
      align="center"
      p="md"
      gap="md"
      className={classes.root}
      tabIndex={0}
      onClick={onClick}>
      {icon}
      <Text size="lg" flex={1}>
        {label}
      </Text>
    </Group>
  );
};
