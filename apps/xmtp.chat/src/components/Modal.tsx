import { Modal as MantineModal, type ModalProps } from "@mantine/core";
import type { CSSProperties } from "react";

export const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
  // For fullscreen modals, use dynamic viewport height to handle mobile keyboards
  const contentStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  if (props.fullScreen) {
    // Use dvh (dynamic viewport height) which accounts for mobile keyboard
    // Fallback to vh for older browsers
    Object.assign(contentStyles, {
      height: "100dvh",
      maxHeight: "100dvh",
    });
  }

  return (
    <MantineModal
      {...props}
      radius="md"
      styles={{
        content: contentStyles,
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
