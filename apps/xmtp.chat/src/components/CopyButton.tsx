import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { IconCopy } from "@/icons/IconCopy";
import classes from "./CopyButton.module.css";

type CopyButtonProps = {
  value: string;
};

export const CopyButton: React.FC<CopyButtonProps> = ({ value }) => {
  const clipboard = useClipboard({ timeout: 1000 });

  const handleCopy = () => {
    clipboard.copy(value);
  };

  const handleKeyboardCopy = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      handleCopy();
    }
  };

  return (
    <Tooltip
      label={
        clipboard.copied ? (
          <Text size="xs">Copied!</Text>
        ) : (
          <Text size="xs">Copy</Text>
        )
      }
      withArrow
      events={{ hover: true, focus: true, touch: true }}>
      <ActionIcon
        variant="transparent"
        onClick={handleCopy}
        onKeyDown={handleKeyboardCopy}
        aria-label="Copy"
        className={classes.button}>
        <IconCopy />
      </ActionIcon>
    </Tooltip>
  );
};
