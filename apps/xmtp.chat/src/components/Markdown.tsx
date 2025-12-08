import {
  Anchor,
  Blockquote,
  Code,
  List,
  Table,
  Text,
  Title,
} from "@mantine/core";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownProps = {
  markdown: string;
};

const components: Components = {
  h1: ({ node, ...rest }) => <Title order={1} {...rest} my="md" />,
  h2: ({ node, ...rest }) => <Title order={2} {...rest} my="md" />,
  h3: ({ node, ...rest }) => <Title order={3} {...rest} my="md" />,
  h4: ({ node, ...rest }) => <Title order={4} {...rest} my="md" />,
  h5: ({ node, ...rest }) => <Title order={5} {...rest} my="md" />,
  h6: ({ node, ...rest }) => <Title order={6} {...rest} my="md" />,
  em: ({ node, ...rest }) => <Text {...rest} component="span" fs="italic" />,
  strong: ({ node, ...rest }) => <Text {...rest} component="span" fw={700} />,
  a: ({ node, ...rest }) => (
    <Anchor {...rest} target="_blank" rel="noopener noreferrer" />
  ),
  ul: ({ node, ...rest }) => <List {...rest} spacing="xxxs" px="md" />,
  ol: ({ node, ...rest }) => (
    <List {...rest} type="ordered" spacing="xxxs" px="md" />
  ),
  li: ({ node, ...rest }) => <List.Item {...rest} />,
  blockquote: ({ node, ...rest }) => <Blockquote {...rest} p="md" />,
  p: ({ node, ...rest }) => <Text {...rest} my="md" />,
  code: ({ node, ...rest }) => <Code {...rest} my="md" />,
  pre: ({ node, ...rest }) => <Code {...rest} block my="md" />,
  del: ({ node, ...rest }) => (
    <Text {...rest} component="span" td="line-through" />
  ),
  table: ({ node, ...rest }) => <Table {...rest} />,
  thead: ({ node, ...rest }) => <Table.Thead {...rest} />,
  tbody: ({ node, ...rest }) => <Table.Tbody {...rest} />,
  tr: ({ node, ...rest }) => <Table.Tr {...rest} />,
  th: ({ node, ...rest }) => <Table.Th {...rest} />,
  td: ({ node, ...rest }) => <Table.Td {...rest} />,
};

export const Markdown: React.FC<MarkdownProps> = ({ markdown }) => {
  return (
    <ReactMarkdown
      disallowedElements={["input", "img", "hr"]}
      components={components}
      skipHtml
      remarkPlugins={[remarkGfm]}>
      {markdown}
    </ReactMarkdown>
  );
};
