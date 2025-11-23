import { Modal as MantineModal, type ModalProps } from "@mantine/core";
import classes from "./Modal.module.css";

export const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
  return (
    <MantineModal
      {...props}
      radius="md"
      classNames={{
        content: classes.content,
        body: classes.body,
      }}
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          ...(props.fullScreen && {
            maxHeight: "100dvh",
            height: "100dvh",
          }),
        },
        body: {
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "hidden",
          minHeight: 0,
        },
      }}>
      {children}
    </MantineModal>
  );
};
