import { Modal as MantineModal, type ModalProps } from "@mantine/core";
import type { CSSProperties } from "react";

export const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
  return (
    <MantineModal
      {...props}
      radius="md"
      styles={{
        content: {
          display: "flex",
          flexDirection: "column",
          ...(props.fullScreen && {
            // Dynamic viewport height for mobile keyboard support
            // Mantine will convert this to CSS where dvh is supported
            height: "100dvh",
            maxHeight: "100dvh",
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
