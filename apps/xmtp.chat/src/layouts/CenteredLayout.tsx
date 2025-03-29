import classes from "./CenteredLayout.module.css";

export const CenteredLayout: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.content}>{children}</div>
    </div>
  );
};
