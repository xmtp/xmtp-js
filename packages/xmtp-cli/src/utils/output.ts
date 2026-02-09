import { stdout } from "node:process";
import { IdentifierKind } from "@xmtp/node-sdk";

export function isTTY(): boolean {
  // isTTY can be undefined when stdout is not a TTY (e.g., piped output)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return stdout.isTTY ?? false;
}

export function jsonStringify(data: unknown, pretty = false): string {
  return JSON.stringify(
    data,
    (_, value: unknown) =>
      typeof value === "bigint" ? value.toString() : value,
    pretty ? 2 : undefined,
  );
}

export function formatOutput(data: unknown, forceJson: boolean): string {
  if (forceJson || !isTTY()) {
    return jsonStringify(data, true);
  }
  return formatHuman(data);
}

export function formatIdentifierKind(kind: IdentifierKind): string {
  switch (kind) {
    case IdentifierKind.Ethereum:
      return "Ethereum";
    case IdentifierKind.Passkey:
      return "Passkey";
  }
}

export function formatTimestampNs(ns: bigint | string | undefined): string {
  if (ns === undefined) return "Unknown";
  const ms = Number(BigInt(ns) / BigInt(1_000_000));
  const date = new Date(ms);
  return date
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, "");
}

export function formatHuman(data: unknown, indent = 0): string {
  const prefix = " ".repeat(indent);

  if (data === null || data === undefined) {
    return "";
  }

  if (typeof data === "string") {
    return prefix + data;
  }

  if (
    typeof data === "number" ||
    typeof data === "boolean" ||
    typeof data === "bigint"
  ) {
    return prefix + String(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return prefix + "(empty)";
    }
    // Format as table if array of objects
    if (typeof data[0] === "object" && data[0] !== null) {
      return formatTable(data as Record<string, unknown>[], prefix);
    }
    return data.map((item) => formatHuman(item, indent)).join("\n");
  }

  if (typeof data === "object") {
    return formatObject(data as Record<string, unknown>, prefix);
  }

  return prefix + jsonStringify(data);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return jsonStringify(value);
}

function formatTable(rows: Record<string, unknown>[], prefix = ""): string {
  if (rows.length === 0) return "";

  const keys = Object.keys(rows[0]);
  const widths = keys.map((key) =>
    Math.max(key.length, ...rows.map((row) => stringifyValue(row[key]).length)),
  );

  const header =
    prefix + keys.map((key, i) => key.padEnd(widths[i])).join("  ");
  const separator = prefix + widths.map((w) => "-".repeat(w)).join("  ");
  const body = rows
    .map(
      (row) =>
        prefix +
        keys
          .map((key, i) => stringifyValue(row[key]).padEnd(widths[i]))
          .join("  "),
    )
    .join("\n");

  return `${header}\n${separator}\n${body}`;
}

function formatObject(
  obj: Record<string, unknown>,
  prefix = "",
  keyWidth?: number,
): string {
  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const maxKeyLen = keyWidth ?? Math.max(...entries.map(([k]) => k.length));
  return entries
    .map(
      ([key, value]) =>
        `${prefix}${key.padEnd(maxKeyLen)}  ${formatHuman(value)}`,
    )
    .join("\n");
}

export type Section = {
  title: string;
  data: Record<string, unknown>;
};

export function formatSections(sections: Section[], indent = 0): string {
  const prefix = " ".repeat(indent);

  // Collect all defined keys across all sections to compute a shared key width
  const allKeys = sections.flatMap((s) =>
    Object.entries(s.data)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k]) => k),
  );
  const keyWidth =
    allKeys.length > 0 ? Math.max(...allKeys.map((k) => k.length)) : 0;

  return sections
    .map((s) => `${s.title}\n\n${formatObject(s.data, prefix, keyWidth)}`)
    .join("\n\n");
}
