import { Box, Button } from "@mantine/core";
import { useNavigate } from "react-router";
import { IconArrowLeft } from "../icons/IconArrowLeft";

export const IdentityNavbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box p="md">
      <Button
        leftSection={<IconArrowLeft />}
        variant="transparent"
        size="md"
        onClick={() => void navigate("/conversations")}>
        Conversations
      </Button>
    </Box>
  );
};
