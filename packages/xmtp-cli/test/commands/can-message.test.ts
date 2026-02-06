import { describe, expect, it } from "vitest";
import {
  createRegisteredIdentity,
  parseJsonOutput,
  runCommand,
} from "../helpers.js";

interface CanMessageResult {
  identifier: string;
  reachable: boolean;
}

describe("can-message", () => {
  it("returns true for registered addresses", async () => {
    const registered = await createRegisteredIdentity();

    const result = await runCommand([
      "can-message",
      registered.address,
      "--env",
      "local",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<CanMessageResult[]>(result.stdout);
    expect(output).toBeInstanceOf(Array);
    expect(output.length).toBe(1);
    expect(output[0].identifier).toBe(registered.address);
    expect(output[0].reachable).toBe(true);
  });

  it("handles multiple addresses", async () => {
    const registered1 = await createRegisteredIdentity();
    const registered2 = await createRegisteredIdentity();

    const result = await runCommand([
      "can-message",
      registered1.address,
      registered2.address,
      "--env",
      "local",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<CanMessageResult[]>(result.stdout);
    expect(output).toBeInstanceOf(Array);
    expect(output.length).toBe(2);
    expect(output[0].reachable).toBe(true);
    expect(output[1].reachable).toBe(true);
  });

  it("returns false for unregistered addresses", async () => {
    // Random addresses that are unlikely to be registered
    const unregisteredAddress = "0x0000000000000000000000000000000000000001";

    const result = await runCommand([
      "can-message",
      unregisteredAddress,
      "--env",
      "local",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<CanMessageResult[]>(result.stdout);
    expect(output[0].reachable).toBe(false);
  });

  it("handles mixed registered and unregistered addresses", async () => {
    const registered = await createRegisteredIdentity();
    const unregisteredAddress = "0x0000000000000000000000000000000000000002";

    const result = await runCommand([
      "can-message",
      registered.address,
      unregisteredAddress,
      "--env",
      "local",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<CanMessageResult[]>(result.stdout);
    expect(output.length).toBe(2);

    const registeredResult = output.find(
      (r) => r.identifier === registered.address,
    );
    const unregisteredResult = output.find(
      (r) => r.identifier === unregisteredAddress,
    );

    expect(registeredResult?.reachable).toBe(true);
    expect(unregisteredResult?.reachable).toBe(false);
  });

  it("handles case-insensitive addresses", async () => {
    const registered = await createRegisteredIdentity();
    const upperCaseAddress = registered.address.toUpperCase();

    const result = await runCommand([
      "can-message",
      upperCaseAddress,
      "--env",
      "local",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);

    const output = parseJsonOutput<CanMessageResult[]>(result.stdout);
    expect(output[0].reachable).toBe(true);
  });

  it("requires at least one address", async () => {
    const result = await runCommand(["can-message", "--env", "local"]);

    expect(result.exitCode).not.toBe(0);
  });

  it("outputs in table format by default", async () => {
    const registered = await createRegisteredIdentity();

    const result = await runCommand([
      "can-message",
      registered.address,
      "--env",
      "local",
    ]);

    expect(result.exitCode).toBe(0);
    // Should contain the address in some format (table output)
    expect(result.stdout.toLowerCase()).toContain(
      registered.address.toLowerCase(),
    );
  });
});
