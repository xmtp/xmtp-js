import { Loader, LoadingOverlay, Stack, Text } from "@mantine/core";

export type LoadingMessageProps = {
  message: string;
};

export const LoadingMessage: React.FC<LoadingMessageProps> = ({ message }) => {
  return (
    <LoadingOverlay
      visible={true}
      loaderProps={{
        children: (
          <Stack gap="xs" justify="center" align="center">
            <Loader />
            <Text>{message}</Text>
          </Stack>
        ),
      }}
    />
  );
};
