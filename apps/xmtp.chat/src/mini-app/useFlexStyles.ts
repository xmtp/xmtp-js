import type { BaseComponentProps } from "@xmtp/content-type-mini-app";
import { useMemo, type CSSProperties } from "react";

export const useFlexStyles = (
  grow: BaseComponentProps["grow"],
  shrink: BaseComponentProps["shrink"],
  basis: BaseComponentProps["basis"],
) => {
  return useMemo(() => {
    const styles: CSSProperties = {};
    if (grow) {
      styles.flexGrow = 1;
    }
    if (shrink) {
      styles.flexShrink = 1;
    }
    if (basis) {
      styles.flexBasis = basis;
    }
    return styles;
  }, [grow, shrink, basis]);
};
