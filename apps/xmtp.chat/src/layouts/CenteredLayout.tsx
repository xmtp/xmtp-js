import classes from "./CenteredLayout.module.css";

type CenteredLayoutProps = React.PropsWithChildren & {
  fullScreen?: boolean;
};

export const CenteredLayout: React.FC<CenteredLayoutProps> = ({
  children,
  fullScreen = false,
}) => {
  const rootClassNames = [
    classes.root,
    fullScreen && classes.fullScreen,
  ].filter(Boolean);
  return (
    <div className={rootClassNames.join(" ")}>
      <div className={classes.content}>{children}</div>
    </div>
  );
};
