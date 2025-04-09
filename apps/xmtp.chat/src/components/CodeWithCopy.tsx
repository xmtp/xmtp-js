import { Box, Code } from "@mantine/core";
import { CopyButton } from "./CopyButton";

type CodeWithCopyProps = {
  code: string;
  maw?: string;
};

export const CodeWithCopy: React.FC<CodeWithCopyProps> = ({ code, maw }) => {
  const maxWidth =
    maw ?? "calc(var(--modal-size) - calc(var(--mantine-spacing-md) * 2))";
  return (
    <Box pos="relative">
      <Code pt="xl" pl="md" pr="md" pb="md" block maw={maxWidth}>
        {code}
      </Code>
      <Box pos="absolute" top={0} right={0} px="xs">
        <CopyButton value={code} />
      </Box>
    </Box>
  );
};
