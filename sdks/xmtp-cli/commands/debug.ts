import { createRequire } from "node:module";
import { loadEnvFile } from "../utils/env.js";
import { Client, XmtpEnv } from "@xmtp/node-sdk";
import {
  parseStandardArgs,
  generateHelpText,
  type StandardCliParams,
} from "../cli-params.js";
import {
  getAgentInstance,
  logOperationStart,
  logOperationSuccess,
  logOperationFailure,
  logSectionHeader,
} from "../core/agent.js";
import { validateEthereumAddress } from "../utils/validation.js";
import { CliManager } from "../cli-manager.js";

// Load environment variables
loadEnvFile(".env");

// Get XMTP SDK version from package.json
const require = createRequire(import.meta.url);
const packageJson = require("../../../package.json");
const xmtpSdkVersion: string =
  packageJson.dependencies["@xmtp/agent-sdk"] ?? "unknown";

interface Config extends StandardCliParams {
  operation:
    | "address"
    | "inbox"
    | "key-package"
    | "resolve"
    | "info"
    | "installations";
  // Address operations
  targetAddress?: string;
  // Inbox operations
  inboxId?: string;
}

function showHelp() {
  const customParams = {
    operation: {
      flags: [
        "address",
        "inbox",
        "key-package",
        "resolve",
        "info",
        "installations",
      ],
      type: "string" as const,
      description: "Operation to perform",
      required: true,
    },
    targetAddress: {
      flags: ["--address", "--target-address"],
      type: "string" as const,
      description: "Ethereum address to query or resolve to inbox ID",
      required: false,
    },
    inboxId: {
      flags: ["--inbox-id"],
      type: "string" as const,
      description: "64-character hexadecimal inbox ID to query",
      required: false,
    },
  };

  const examples = [
    "yarn debug address --address 0x1234...",
    "yarn debug address --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64",
    "yarn debug resolve --address 0x1234...",
    "yarn debug resolve --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64",
    "yarn debug inbox --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64",
    "yarn debug inbox --address 0x1234...",
    "yarn debug key-package --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64",
    "yarn debug key-package --address 0x1234...",
    "yarn debug installations --inbox-id 743f3805fa9daaf879103bc26a2e79bb53db688088259c23cf18dcf1ea2aee64",
    "yarn debug installations --address 0x1234...",
    "yarn debug info",
  ];

  console.log(
    generateHelpText(
      "XMTP Debug CLI - Address, Inbox, Key Package, and Installation Information",
      "Get detailed information about XMTP addresses, inboxes, key packages, and installations",
      "yarn debug <operation> [options]",
      customParams,
      examples,
    ),
  );
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  // Handle help
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // Extract operation from first argument if not a flag
  let operation = "info";
  let remainingArgs = args;

  const firstArg = args[0];
  if (firstArg !== undefined && args.length > 0 && !firstArg.startsWith("--")) {
    operation = firstArg;
    remainingArgs = args.slice(1);
  }

  const customParams = {
    targetAddress: {
      flags: ["--address", "--target-address"],
      type: "string" as const,
      description: "Ethereum address to query or resolve to inbox ID",
      required: false,
    },
    inboxId: {
      flags: ["--inbox-id"],
      type: "string" as const,
      description: "64-character hexadecimal inbox ID to query",
      required: false,
    },
  };

  const config = parseStandardArgs(remainingArgs, customParams) as Config;
  config.operation = operation as
    | "address"
    | "inbox"
    | "key-package"
    | "resolve"
    | "info"
    | "installations";

  // Validation
  if (config.targetAddress && !validateEthereumAddress(config.targetAddress)) {
    throw new Error(`Invalid target address: ${config.targetAddress}`);
  }

  if (config.inboxId && !/^[a-f0-9]{64}$/i.test(config.inboxId)) {
    throw new Error(`Invalid inbox ID format: ${config.inboxId}`);
  }

  return config;
}

// Operation: Address Information
async function runAddressOperation(config: Config): Promise<void> {
  if (!config.targetAddress && !config.inboxId) {
    console.error(`❌ Error: Either --address or --inbox-id is required for address operation`);
    console.log(`   Usage: yarn debug address --address <ethereum-address>`);
    console.log(`   Or: yarn debug address --inbox-id <inbox-id>`);
    return;
  }

  // If both are provided, address takes precedence
  if (config.targetAddress && config.inboxId) {
    console.warn(`⚠️  Both --address and --inbox-id provided. Using --address.`);
  }

  // Determine which identifier to use
  let targetInboxId: string;
  let targetAddress: string | undefined;
  let identifierType: string;

  if (config.targetAddress) {
    // Resolve address to inbox ID
    const agent = await getAgentInstance();
    try {
      const resolvedInboxId = await agent.client.getInboxIdByIdentifier({
        identifier: config.targetAddress,
        identifierKind: 0,
      });

      if (!resolvedInboxId) {
        console.log(`❌ No inbox found for address: ${config.targetAddress}`);
        console.log(`   This address may not be registered with XMTP`);
        return;
      }
      
      targetInboxId = resolvedInboxId;
      
      targetAddress = config.targetAddress;
      identifierType = "address";
      console.log(`📍 Resolved address ${config.targetAddress} to inbox ID: ${targetInboxId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to resolve address to inbox ID: ${errorMessage}`);
      return;
    }
  } else {
    // Resolve inbox ID to address
    targetInboxId = config.inboxId!;
    identifierType = "inbox ID";
  }

  logOperationStart(
    "Address Information",
    `Getting information for ${identifierType}: ${config.targetAddress || config.inboxId}`,
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get address from inbox ID if we started with inbox-id
    if (!targetAddress && config.inboxId) {
      // Get inbox state to find the address
      const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
        [targetInboxId],
        true,
      );
      
      if (inboxState && inboxState.length > 0) {
        const firstState = inboxState[0];
        if (firstState) {
          targetAddress = firstState.identifiers[0]?.identifier || undefined;
        }
      }
    }

    if (!targetInboxId) {
      console.log(`❌ No inbox found for ${identifierType}: ${config.targetAddress || config.inboxId}`);
      console.log(`   This ${identifierType} may not be registered with XMTP`);
      return;
    }

    // Get inbox state
    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (!inboxState || inboxState.length === 0) {
      console.log(
        `❌ No inbox state found for ${identifierType}: ${config.targetAddress || config.inboxId}`,
      );
      return;
    }

    const state = inboxState[0];
    if (!state) {
      console.log(`❌ No inbox state found for ${identifierType}: ${config.targetAddress || config.inboxId}`);
      return;
    }
    const installations = state.installations;

    logSectionHeader("Address Information");
    if (targetAddress) {
      console.log(`   Address: ${targetAddress}`);
    }
    if (config.inboxId) {
      console.log(`   ${identifierType}: ${config.inboxId}`);
    }
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Total Installations: ${installations.length}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    if (installations.length > 0) {
      console.log(`\n📱 Installations:`);
      installations.forEach((installation: { id: string }, index: number) => {
        console.log(`   ${index + 1}. ${installation.id}`);
      });
    }

    logOperationSuccess("Address Information");
  } catch (error) {
    logOperationFailure("Address Information", error as Error);
  }
}

// Operation: Resolve Address to Inbox ID (or vice versa)
async function runResolveOperation(config: Config): Promise<void> {
  if (!config.targetAddress && !config.inboxId) {
    console.error(`❌ Error: Either --address or --inbox-id is required for resolve operation`);
    console.log(`   Usage: yarn debug resolve --address <ethereum-address>`);
    console.log(`   Or: yarn debug resolve --inbox-id <inbox-id>`);
    return;
  }

  // If both are provided, address takes precedence
  if (config.targetAddress && config.inboxId) {
    console.warn(`⚠️  Both --address and --inbox-id provided. Using --address.`);
  }

  // Get agent
  const agent = await getAgentInstance();

  try {
    if (config.targetAddress) {
      // Resolve address to inbox ID
      logOperationStart(
        "Resolve Address",
        `Resolving address to inbox ID: ${config.targetAddress}`,
      );

      const resolvedInboxId = await agent.client.getInboxIdByIdentifier({
        identifier: config.targetAddress,
        identifierKind: 0,
      });

      if (!resolvedInboxId) {
        console.log(`❌ No inbox found for address: ${config.targetAddress}`);
        console.log(`   This address may not be registered with XMTP`);
        return;
      }
      
      const inboxId = resolvedInboxId;

      logSectionHeader("Address Resolution");
      console.log(`   Address: ${config.targetAddress}`);
      console.log(`   Inbox ID: ${inboxId}`);
      console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);
    } else {
      // Resolve inbox ID to address
      logOperationStart(
        "Resolve Inbox ID",
        `Resolving inbox ID to address: ${config.inboxId}`,
      );

      const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
        [config.inboxId!],
        true,
      );

      if (!inboxState || inboxState.length === 0) {
        console.log(`❌ No inbox state found for inbox ID: ${config.inboxId}`);
        console.log(`   This inbox ID may not exist or be registered with XMTP`);
        return;
      }

      const firstState = inboxState[0];
      if (!firstState) {
        console.log(`❌ No inbox state found for inbox ID: ${config.inboxId}`);
        return;
      }
      const address = firstState.identifiers[0]?.identifier;

      if (!address) {
        console.log(`❌ No address found for inbox ID: ${config.inboxId}`);
        return;
      }

      logSectionHeader("Inbox ID Resolution");
      console.log(`   Inbox ID: ${config.inboxId}`);
      console.log(`   Address: ${address}`);
      console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);
    }

    logOperationSuccess("Resolve Operation");
  } catch (error) {
    logOperationFailure("Resolve Operation", error as Error);
  }
}

// Operation: Inbox Information
async function runInboxOperation(config: Config): Promise<void> {
  if (!config.inboxId && !config.targetAddress) {
    console.error(`❌ Error: Either --inbox-id or --address is required for inbox operation`);
    console.log(`   Usage: yarn debug inbox --inbox-id <inbox-id>`);
    console.log(`   Or: yarn debug inbox --address <ethereum-address>`);
    return;
  }

  // If both are provided, inbox-id takes precedence
  if (config.inboxId && config.targetAddress) {
    console.warn(`⚠️  Both --inbox-id and --address provided. Using --inbox-id.`);
  }

  // Determine which identifier to use
  let targetInboxId: string;
  let identifierType: string;
  
  if (config.inboxId) {
    targetInboxId = config.inboxId;
    identifierType = "inbox ID";
  } else {
    // Resolve address to inbox ID
    const agent = await getAgentInstance();
    try {
      const resolvedInboxId = await agent.client.getInboxIdByIdentifier({
        identifier: config.targetAddress!,
        identifierKind: 0,
      });
      
      if (!resolvedInboxId) {
        console.log(`❌ No inbox found for address: ${config.targetAddress}`);
        console.log(`   This address may not be registered with XMTP`);
        return;
      }
      
      targetInboxId = resolvedInboxId;
      console.log(`📍 Resolved address ${config.targetAddress} to inbox ID: ${targetInboxId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to resolve address to inbox ID: ${errorMessage}`);
      return;
    }
    identifierType = "address";
  }

  logOperationStart(
    "Inbox Information",
    `Getting information for ${identifierType}: ${config.inboxId || config.targetAddress}`,
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get inbox state
    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (!inboxState || inboxState.length === 0) {
      console.log(`❌ No inbox state found for ${identifierType}: ${config.inboxId || config.targetAddress}`);
      return;
    }

    const state = inboxState[0];
    if (!state) {
      console.log(`❌ No inbox state found for ${identifierType}: ${config.inboxId || config.targetAddress}`);
      return;
    }

    const installations = state.installations;
    const identifiers = state.identifiers;

    logSectionHeader("Inbox Information");
    console.log(`   ${identifierType}: ${config.inboxId || config.targetAddress}`);
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Total Installations: ${installations.length}`);
    console.log(`   Total Identifiers: ${identifiers.length}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    if (identifiers.length > 0) {
      console.log(`\n🏷️  Identifiers:`);
      identifiers.forEach((identifier, index: number) => {
        const identifierKindStr = typeof identifier.identifierKind === "string" 
          ? identifier.identifierKind 
          : String(identifier.identifierKind);
        console.log(
          `   ${index + 1}. ${identifier.identifier} (kind: ${identifierKindStr})`,
        );
      });
    }

    if (installations.length > 0) {
      console.log(`\n📱 Installations:`);
      installations.forEach((installation: { id: string }, index: number) => {
        console.log(`   ${index + 1}. ${installation.id}`);
      });
    }

    logOperationSuccess("Inbox Information");
  } catch (error) {
    logOperationFailure("Inbox Information", error as Error);
  }
}

// Operation: Key Package Information
async function runKeyPackageOperation(config: Config): Promise<void> {
  if (!config.inboxId && !config.targetAddress) {
    console.error(`❌ Error: Either --inbox-id or --address is required for key-package operation`);
    console.log(`   Usage: yarn debug key-package --inbox-id <inbox-id>`);
    console.log(`   Or: yarn debug key-package --address <ethereum-address>`);
    return;
  }

  // If both are provided, inbox-id takes precedence
  if (config.inboxId && config.targetAddress) {
    console.warn(`⚠️  Both --inbox-id and --address provided. Using --inbox-id.`);
  }

  // Determine which identifier to use
  let targetInboxId: string;
  let identifierType: string;
  
  if (config.inboxId) {
    targetInboxId = config.inboxId;
    identifierType = "inbox ID";
  } else {
    // Resolve address to inbox ID
    const agent = await getAgentInstance();
    try {
      const resolvedInboxId = await agent.client.getInboxIdByIdentifier({
        identifier: config.targetAddress!,
        identifierKind: 0,
      });
      
      if (!resolvedInboxId) {
        console.log(`❌ No inbox found for address: ${config.targetAddress}`);
        console.log(`   This address may not be registered with XMTP`);
        return;
      }
      
      targetInboxId = resolvedInboxId;
      console.log(`📍 Resolved address ${config.targetAddress} to inbox ID: ${targetInboxId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to resolve address to inbox ID: ${errorMessage}`);
      return;
    }
    identifierType = "address";
  }

  logOperationStart(
    "Key Package Information",
    `Getting key package status for ${identifierType}: ${config.inboxId || config.targetAddress}`,
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get inbox state for the target inbox ID
    const inboxState = await agent.client.preferences.inboxStateFromInboxIds(
      [targetInboxId],
      true,
    );

    if (!inboxState || inboxState.length === 0) {
      console.log(`❌ No inbox state found for ${identifierType}: ${config.inboxId || config.targetAddress}`);
      return;
    }

    const state = inboxState[0];
    if (!state) {
      console.log(`❌ No inbox state found for ${identifierType}: ${config.inboxId || config.targetAddress}`);
      return;
    }
    const addressFromInboxId = state.identifiers[0]?.identifier || "Unknown";
    const installations = state.installations;

    // Get installation IDs
    const installationIds = installations.map(
      (installation: { id: string }) => installation.id,
    );

    // Get key package statuses
    const status = (await agent.client.getKeyPackageStatusesForInstallationIds(
      installationIds,
    )) as Record<string, any>;

    // Count valid and invalid installations
    const totalInstallations = Object.keys(status).length;
    const validInstallations = Object.values(status).filter(
      (value) => !value?.validationError,
    ).length;
    const invalidInstallations = totalInstallations - validInstallations;

    logSectionHeader("Key Package Status");
    console.log(`   ${identifierType}: ${config.inboxId || config.targetAddress}`);
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Address: ${addressFromInboxId}`);
    console.log(`   Total Installations: ${totalInstallations}`);
    console.log(`   Valid Installations: ${validInstallations}`);
    console.log(`   Invalid Installations: ${invalidInstallations}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "production"}`);

    if (totalInstallations > 0) {
      console.log(`\n🔑 Installation Details:`);

      for (const [installationId, installationStatus] of Object.entries(
        status,
      )) {
        // Abbreviate the installation ID (first 4 and last 4 characters)
        const shortId =
          installationId.length > 8
            ? `${installationId.substring(0, 4)}...${installationId.substring(installationId.length - 4)}`
            : installationId;

        if (installationStatus?.lifetime) {
          const createdDate = new Date(
            Number(installationStatus.lifetime.notBefore) * 1000,
          );
          const expiryDate = new Date(
            Number(installationStatus.lifetime.notAfter) * 1000,
          );

          console.log(
            `   ✅ ${shortId}: Created ${createdDate.toLocaleDateString()}, Valid until ${expiryDate.toLocaleDateString()}`,
          );
        } else if (installationStatus?.validationError) {
          console.log(
            `   ❌ ${shortId}: Error - ${installationStatus.validationError}`,
          );
        }
      }
    }

    logOperationSuccess("Key Package Information");
  } catch (error) {
    logOperationFailure("Key Package Information", error as Error);
  }
}

// Operation: General Info
async function runInfoOperation(_config: Config): Promise<void> {
  logOperationStart(
    "General Information",
    "Getting general XMTP debug information",
  );

  // Get agent
  const agent = await getAgentInstance();

  try {
    // Get client details
    const inboxId = agent.client.inboxId;
    const installationId = agent.client.installationId;
    const appVersion = agent.client.options?.appVersion;
    const env = agent.client.options?.env ?? "dev";

    // Get inbox state and key package info
    const inboxState = await agent.client.preferences.inboxState();
    const keyPackageStatuses =
      await agent.client.getKeyPackageStatusesForInstallationIds([
        installationId,
      ]);
    const keyPackageStatus = keyPackageStatuses[installationId];

    let createdDate = new Date();
    let expiryDate = new Date();
    if (keyPackageStatus?.lifetime) {
      createdDate = new Date(
        Number(keyPackageStatus.lifetime.notBefore) * 1000,
      );
      expiryDate = new Date(Number(keyPackageStatus.lifetime.notAfter) * 1000);
    }

    // Get conversations
    const conversations = await agent.client.conversations.list();

    logSectionHeader("General Debug Information");
    console.log(`   XMTP Agent SDK: ${xmtpSdkVersion}`);
    console.log(`   Client Version: ${agent.client.constructor.name}`);
    console.log(`   App Version: ${appVersion}`);
    console.log(`   Environment: ${env}`);
    console.log(`   Inbox ID: ${inboxId}`);
    console.log(`   Installation ID: ${installationId}`);
    console.log(`   Total Installations: ${inboxState.installations.length}`);
    console.log(`   Key Package Created: ${createdDate.toLocaleString()}`);
    console.log(`   Key Package Valid Until: ${expiryDate.toLocaleString()}`);
    console.log(`   Total Conversations: ${conversations.length}`);
    console.log(`   Status: ✅ Running`);

    logOperationSuccess("General Information");
  } catch (error) {
    logOperationFailure("General Information", error as Error);
  }
}

// Operation: Installations Information
async function runInstallationsOperation(config: Config): Promise<void> {
  if (!config.inboxId && !config.targetAddress) {
    console.error(
      `❌ Error: Either --inbox-id or --address is required for installations operation`,
    );
    console.log(`   Usage: yarn debug installations --inbox-id <inbox-id>`);
    console.log(`   Or: yarn debug installations --address <ethereum-address>`);
    return;
  }

  // If both are provided, inbox-id takes precedence
  if (config.inboxId && config.targetAddress) {
    console.warn(`⚠️  Both --inbox-id and --address provided. Using --inbox-id.`);
  }

  // Determine which identifier to use
  let targetInboxId: string;
  let identifierType: string;
  
  if (config.inboxId) {
    targetInboxId = config.inboxId;
    identifierType = "inbox ID";
  } else {
    // Resolve address to inbox ID
    const agent = await getAgentInstance();
    try {
      const resolvedInboxId = await agent.client.getInboxIdByIdentifier({
        identifier: config.targetAddress!,
        identifierKind: 0,
      });
      
      if (!resolvedInboxId) {
        console.log(`❌ No inbox found for address: ${config.targetAddress}`);
        console.log(`   This address may not be registered with XMTP`);
        return;
      }
      
      targetInboxId = resolvedInboxId;
      console.log(`📍 Resolved address ${config.targetAddress} to inbox ID: ${targetInboxId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to resolve address to inbox ID: ${errorMessage}`);
      return;
    }
    identifierType = "address";
  }

  logOperationStart(
    "Installations Information",
    `Getting installation information for ${identifierType}: ${config.inboxId || config.targetAddress}`,
  );

  try {
    await getAgentInstance();

    const inboxState = await Client.inboxStateFromInboxIds(
      [targetInboxId],
      (process.env.XMTP_ENV as XmtpEnv) ?? "dev",
    );

    if (!inboxState || inboxState.length === 0) {
      console.log(`❌ No inbox state found for ${identifierType}: ${config.inboxId || config.targetAddress}`);
      return;
    }

    const firstState = inboxState[0];
    if (!firstState) {
      console.log(`❌ No inbox state found for ${identifierType}: ${config.inboxId || config.targetAddress}`);
      return;
    }

    const installations = firstState.installations;

    logSectionHeader("Installation Debug Information");
    console.log(`   ${identifierType}: ${config.inboxId || config.targetAddress}`);
    console.log(`   Inbox ID: ${targetInboxId}`);
    console.log(`   Environment: ${process.env.XMTP_ENV ?? "dev"}`);
    console.log(`   Total Installations: ${installations.length}`);

    installations.forEach((installation, index: number) => {
      console.log(`\n   Installation ${index + 1}:`);
      console.log(`     ID: ${installation.id}`);
      if ("bytes" in installation && Array.isArray(installation.bytes)) {
        console.log(`     Bytes Length: ${installation.bytes.length}`);
      }
    });

    logOperationSuccess(
      "Installations Information",
      "Installation information retrieved",
    );
  } catch (error) {
    logOperationFailure("Installations Information", error as Error);
  }
}

/**
 * Check if CLI manager should be used and handle execution
 */
async function handleCliManagerExecution(): Promise<void> {
  const args = process.argv.slice(2);

  // Check if CLI manager parameters are present
  const hasManagerArgs = args.some(
    (arg) =>
      arg === "--repeat" ||
      arg === "--delay" ||
      arg === "--continue-on-error" ||
      arg === "--verbose",
  );

  if (!hasManagerArgs) {
    // No manager args, run normally
    await main();
    return;
  }

  // Parse manager configuration
  const { skillArgs, config: managerConfig } =
    CliManager.parseManagerArgs(args);

  if (managerConfig.repeat && managerConfig.repeat > 1) {
    console.log(
      `🔄 CLI Manager: Executing debug command ${managerConfig.repeat} time(s)`,
    );

    const manager = new CliManager(managerConfig);
    const results = await manager.executeYarnCommand(
      "debug",
      skillArgs,
      managerConfig,
    );

    // Exit with error code if any execution failed
    const hasFailures = results.some((r) => !r.success);
    process.exit(hasFailures ? 1 : 0);
  } else {
    // Single execution with manager args but no repeat
    await main();
  }
}

async function main(): Promise<void> {
  const config = parseArgs();

  switch (config.operation) {
    case "address":
      await runAddressOperation(config);
      break;
    case "resolve":
      await runResolveOperation(config);
      break;
    case "inbox":
      await runInboxOperation(config);
      break;
    case "key-package":
      await runKeyPackageOperation(config);
      break;
    case "installations":
      await runInstallationsOperation(config);
      break;
    case "info":
      await runInfoOperation(config);
      break;
    default:
      showHelp();
      break;
  }

  process.exit(0);
}

void handleCliManagerExecution();
