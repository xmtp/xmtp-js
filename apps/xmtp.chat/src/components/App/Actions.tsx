import { Button, Flex, useMatches } from "@mantine/core";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useRefManager } from "@/contexts/RefManager";
import { useXMTP } from "@/contexts/XMTPContext";
import { IconMessagePlus } from "@/icons/IconMessagePlus";

export const Actions: React.FC = () => {
  const { client } = useXMTP();
  const navigate = useNavigate();
  const { setRef } = useRefManager();
  const ref = useRef<HTMLButtonElement>(null);
  const label: React.ReactNode = useMatches({
    base: <IconMessagePlus size={24} />,
    sm: "New conversation",
  });
  const px = useMatches({
    base: "xs",
    sm: "md",
  });
  const handleClick = () => {
    void navigate("/conversations/new");
  };

  useEffect(() => {
    setRef("new-conversation-button", ref);
  }, []);

  return (
    client && (
      <Flex align="center" gap="xs">
        <Button px={px} onClick={handleClick} ref={ref}>
          {label}
        </Button>
      </Flex>
    )
  );
};
