import {
  CliParam,
  CliConfig,
  parseCliArgs,
  generateHelpText as generateHelpTextShared,
} from "./cli-utils.js";

// Standard CLI parameter definitions
export interface StandardCliParams extends CliConfig {
  // Common parameters
  help?: boolean;
  target?: string;
  groupId?: string;
  message?: string;
  count?: number;

  // CLI Manager parameters
  repeat?: number;
  delay?: number;
  continueOnError?: boolean;
  verbose?: boolean;

  // Skill-specific parameters
  [key: string]: any;
}

// Parameter definitions with validation rules
export const PARAM_DEFINITIONS: Record<string, CliParam> = {
  help: {
    flags: ["--help", "-h"],
    type: "boolean",
    description: "Show help message",
    required: false,
  },
  target: {
    flags: ["--target"],
    type: "string",
    description: "Target wallet address",
    required: false,
  },
  groupId: {
    flags: ["--group-id"],
    type: "string",
    description: "Group ID for group operations",
    required: false,
  },
  message: {
    flags: ["--message"],
    type: "string",
    description: "Message text to send",
    required: false,
  },
  count: {
    flags: ["--count"],
    type: "number",
    description: "Numeric count parameter",
    required: false,
  },
  repeat: {
    flags: ["--repeat"],
    type: "number",
    description: "Number of times to repeat the command execution",
    required: false,
  },
  delay: {
    flags: ["--delay"],
    type: "number",
    description: "Delay in milliseconds between repeated executions",
    required: false,
  },
  continueOnError: {
    flags: ["--continue-on-error"],
    type: "boolean",
    description: "Continue execution even if a command fails",
    required: false,
  },
  verbose: {
    flags: ["--verbose"],
    type: "boolean",
    description: "Enable verbose output for CLI manager",
    required: false,
  },
};

// Parse command line arguments using standard definitions
export function parseStandardArgs(
  args: string[],
  customParams: Record<string, CliParam> = {},
): StandardCliParams {
  // Merge custom parameters with standard ones
  const allParams = { ...PARAM_DEFINITIONS, ...customParams };

  return parseCliArgs(args, allParams) as StandardCliParams;
}

// Generate help text from parameter definitions
export function generateHelpText(
  skillName: string,
  description: string,
  usage: string,
  customParams: Record<string, CliParam> = {},
  examples: string[] = [],
): string {
  const allParams = { ...PARAM_DEFINITIONS, ...customParams };

  return generateHelpTextShared(
    skillName,
    description,
    usage,
    allParams,
    examples,
  );
}

// Validation helpers
export function validateRequiredParams(
  config: StandardCliParams,
  required: string[],
): void {
  const missing = required.filter((param) => !(config as any)[param]);
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(", ")}`);
  }
}

export function validateMutuallyExclusive(
  config: StandardCliParams,
  groups: string[][],
): void {
  groups.forEach((group) => {
    const present = group.filter((param) => (config as any)[param]);
    if (present.length > 1) {
      throw new Error(
        `Cannot use these parameters together: ${present.join(", ")}`,
      );
    }
  });
}
