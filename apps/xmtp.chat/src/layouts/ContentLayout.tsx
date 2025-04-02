import {
  Box,
  FocusTrap,
  Group,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Text,
  type MantineStyleProps,
} from "@mantine/core";
import classes from "./ContentLayout.module.css";

export type ContentLayoutProps = React.PropsWithChildren<{
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  loading?: boolean;
  maxHeight?: MantineStyleProps["mah"];
  title?: React.ReactNode;
  withScrollArea?: boolean;
  withScrollFade?: boolean;
  withScrollAreaPadding?: boolean;
}>;

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  children,
  footer,
  headerActions,
  loading = false,
  maxHeight,
  title,
  withScrollArea = true,
  withScrollFade = true,
  withScrollAreaPadding = true,
}) => {
  return (
    <FocusTrap>
      <Stack className={classes.root} gap={0}>
        <LoadingOverlay visible={loading} />
        {(title || headerActions) && (
          <Group
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
        )}
        <Box
          className={[
            classes.content,
            withScrollFade ? classes.contentScrollFade : undefined,
          ]
            .filter(Boolean)
            .join(" ")}>
          {withScrollArea ? (
            <ScrollArea
              type="scroll"
              className={classes.scrollArea}
              px={withScrollAreaPadding ? "md" : 0}>
              <Box mah={maxHeight}>{children}</Box>
            </ScrollArea>
          ) : (
            <>{children}</>
          )}
        </Box>
        {footer && (
          <Group
            gap="xs"
            align="center"
            className={classes.footer}
            wrap="nowrap">
            {footer}
          </Group>
        )}
      </Stack>
    </FocusTrap>
  );
};
