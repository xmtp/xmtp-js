import {
  Box,
  FocusTrap,
  Group,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import classes from "./ContentLayout.module.css";

export type ContentLayoutProps = React.PropsWithChildren<{
  loading?: boolean;
  title: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  withScrollArea?: boolean;
}>;

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  children,
  loading = false,
  title,
  headerActions,
  footer,
  withScrollArea = true,
}) => {
  return (
    <FocusTrap>
      <Stack className={classes.root} gap={0}>
        <LoadingOverlay visible={loading} />
        <Group
          justify="space-between"
          align="center"
          gap="xs"
          p="md"
          wrap="nowrap"
          className={classes.header}>
          {typeof title === "string" ? (
            <Text fw={700} size="lg" truncate>
              {title}
            </Text>
          ) : (
            title
          )}
          <Box className={classes.headerActions}>{headerActions}</Box>
        </Group>
        <Box className={classes.content}>
          {withScrollArea ? (
            <ScrollArea type="scroll" className={classes.scrollArea} px="md">
              {children}
            </ScrollArea>
          ) : (
            <>{children}</>
          )}
        </Box>
        <Group gap="xs" align="center" className={classes.footer} wrap="nowrap">
          {footer}
        </Group>
      </Stack>
    </FocusTrap>
  );
};
