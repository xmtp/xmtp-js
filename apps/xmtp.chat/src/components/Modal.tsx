import { Modal as MantineModal, type ModalProps } from "@mantine/core";

export const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
  return (
    <MantineModal
      {...props}
      radius="md"
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
        },
        body: {
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        },
      }}>
      {children}
    </MantineModal>
  );
};
