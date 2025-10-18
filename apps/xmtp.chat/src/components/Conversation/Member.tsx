import { Button, Group } from "@mantine/core";
import {
  MemberCard,
  type Member as MemberCardMember,
} from "@/components/Conversation/MemberCard";
import classes from "./Member.module.css";

export type MemberProps = MemberCardMember & {
  onClick?: () => void;
  buttonLabel?: string;
};

export const Member: React.FC<MemberProps> = ({
  address,
  displayName,
  avatar,
  description,
  onClick,
  buttonLabel = "Remove",
}) => {
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="nowrap"
      p="xxxs"
      className={classes.root}>
      <MemberCard
        address={address}
        displayName={displayName}
        avatar={avatar}
        description={description}
        withClass={false}
        shortenAddress={false}
      />
      {onClick && (
        <Group className={classes.button} align="center" justify="center">
          <Button size="xs" onClick={onClick}>
            {buttonLabel}
          </Button>
        </Group>
      )}
    </Group>
  );
};
