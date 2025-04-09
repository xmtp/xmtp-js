import { Modal as MantineModal, type ModalProps } from "@mantine/core";

export const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
  return (
    <MantineModal
      {...props}
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
        },
        body: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
        },
      }}>
      {children}
    </MantineModal>
  );
};
