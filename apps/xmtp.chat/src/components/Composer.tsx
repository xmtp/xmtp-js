import { Button, Flex, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

export const Composer = () => {
  const [sendDisabled, setSendDisabled] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSendDisabled(message.length === 0);
  }, [message]);

  return (
    <Flex align="center" gap="xs" p="md">
      <TextInput
        size="md"
        placeholder="Type a message..."
        flex={1}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
      />
      <Button disabled={sendDisabled} size="md">
        Send
      </Button>
    </Flex>
  );
};
