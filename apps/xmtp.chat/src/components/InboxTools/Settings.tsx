import { Stack } from "@mantine/core";
import { LoggingSelect } from "@/components/App/LoggingSelect";
import { NetworkSelect } from "@/components/App/NetworkSelect";
import { UseSCW } from "@/components/App/UseSCW";
import classes from "./Settings.module.css";

export const Settings = () => {
  return (
    <Stack gap="0" className={classes.root}>
      <NetworkSelect />
      <UseSCW />
      <LoggingSelect />
    </Stack>
  );
};
