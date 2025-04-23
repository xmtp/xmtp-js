import type { BaseComponentProps } from "@xmtp/content-type-mini-app";
import { useMemo, type CSSProperties } from "react";

export const useBorderStyles = (
  border: BaseComponentProps["border"],
  radius: BaseComponentProps["radius"],
) => {
  return useMemo(() => {
    const styles: CSSProperties = {};
    if (border) {
      styles.border = border;
    }
    if (radius) {
      styles.borderRadius = radius;
    }
    return styles;
  }, [border, radius]);
};
