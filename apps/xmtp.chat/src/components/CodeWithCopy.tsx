import { Box, Code } from "@mantine/core";
import { CopyButton } from "./CopyButton";

type CodeWithCopyProps = {
  code: string;
};

export const CodeWithCopy: React.FC<CodeWithCopyProps> = ({ code }) => {
  return (
    <Box pos="relative">
      <Code
        pt="xl"
        pl="md"
        pr="md"
        pb="md"
        block
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
        {code}
      </Code>
      <Box pos="absolute" top={0} right={0} px="xs">
        <CopyButton value={code} />
      </Box>
    </Box>
  );
};
