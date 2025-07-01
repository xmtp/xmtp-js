import { Stack } from "@mantine/core";
import { DisableAnalytics } from "@/components/App/DisableAnalytics";
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
      <DisableAnalytics />
    </Stack>
  );
};
