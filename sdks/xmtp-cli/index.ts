#!/usr/bin/env node
import { Command } from "commander";
import { registerContentTypesCommand } from "./commands/content-types";
import { registerDebugCommand } from "./commands/debug";
import { registerGroupsCommand } from "./commands/groups";
import { registerListCommand } from "./commands/list";
import { registerPermissionsCommand } from "./commands/permissions";
import { registerSendCommand } from "./commands/send";

const program = new Command();

program.name("xmtp").description("XMTP CLI").version("0.0.1");

// Register all commands
registerGroupsCommand(program);
registerSendCommand(program);
registerDebugCommand(program);
registerPermissionsCommand(program);
registerListCommand(program);
registerContentTypesCommand(program);

program.parse();
