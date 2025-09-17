import { Flex, Text, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { formatRFC3339, intlFormat } from "date-fns";

export type DateLabelTooltipProps = {
  date: Date;
};

export const DateLabelTooltip: React.FC<DateLabelTooltipProps> = ({ date }) => {
  return (
    <Flex direction="column">
      <Text size="sm">{formatRFC3339(date, { fractionDigits: 3 })}</Text>
      <Text size="xs" c="dimmed" ta="center">
        click to copy
      </Text>
    </Flex>
  );
};

export type DateLabelProps = {
  date: Date;
  size?: "sm" | "xs" | "md" | "lg" | "xl";
  align?: "left" | "right" | "center";
  padding?: "xs" | "sm" | "md" | "lg" | "xl";
};

export const DateLabel: React.FC<DateLabelProps> = ({
  date,
  size = "sm",
  align = "left",
  padding,
}) => {
  const clipboard = useClipboard({ timeout: 1000 });

  const handleCopy = (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();
    clipboard.copy(formatRFC3339(date, { fractionDigits: 3 }));
  };

  const handleKeyboardCopy = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleCopy(event);
    }
  };

  return (
    <Tooltip
      label={
        clipboard.copied ? (
          <Text size="xs">Copied!</Text>
        ) : (
          <DateLabelTooltip date={date} />
        )
      }
      withArrow
      events={{ hover: true, focus: true, touch: true }}>
      <Text
        p={padding}
        pt={0}
        size={size}
        ta={align}
        onKeyDown={handleKeyboardCopy}
        onClick={handleCopy}
        miw={100}
        tabIndex={0}>
        {intlFormat(date, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </Text>
    </Tooltip>
  );
};
