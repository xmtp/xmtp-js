import { Button, Flex, useMatches } from "@mantine/core";
import { useNavigate } from "react-router";
import { useClient } from "../hooks/useClient";
import { IconMessagePlus } from "../icons/IconMessagePlus";

export const Actions: React.FC = () => {
  const { client } = useClient();
  const navigate = useNavigate();
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
  return (
    client && (
      <Flex align="center" gap="xs">
        <Button px={px} onClick={handleClick}>
          {label}
        </Button>
      </Flex>
    )
  );
};
