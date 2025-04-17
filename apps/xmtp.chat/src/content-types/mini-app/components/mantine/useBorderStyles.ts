import { useMemo, type CSSProperties } from "react";
import type { BaseComponentProps } from "@/content-types/mini-app/types";

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
