import { describe, expect, it } from "vitest";
import { createBackend } from "@/utils/createBackend";

// Browser-sdk tests run in a browser environment (vitest + playwright).
// Unlike node-sdk, the WASM BackendBuilder methods consume `self` and
// return a new instance, so we can't easily mock them by extending.
// Instead, we test the real implementation since WASM is available in
// the browser test environment. We avoid calling `build()` on envs that
// require a network connection by only testing the configuration API.

describe("createBackend", () => {
  it("should create a backend with default options", async () => {
    const backend = await createBackend();
    expect(backend).toBeDefined();
    // WASM enums are numeric at runtime: Dev = 1
    expect(backend.env).toBe(1);
  });

  it("should create a backend with production env", async () => {
    const backend = await createBackend({ env: "production" });
    // WASM enums are numeric: Production = 2
    expect(backend.env).toBe(2);
  });

  it("should create a backend with local env", async () => {
    const backend = await createBackend({ env: "local" });
    // WASM enums are numeric: Local = 0
    expect(backend.env).toBe(0);
  });

  it("should create a backend with appVersion", async () => {
    const backend = await createBackend({
      env: "dev",
      appVersion: "test/1.0.0",
    });
    expect(backend).toBeDefined();
    expect(backend.appVersion).toBe("test/1.0.0");
  });

  it("should create a backend with apiUrl override", async () => {
    const backend = await createBackend({
      apiUrl: "https://custom-api.example.com:5558",
    });
    expect(backend).toBeDefined();
    expect(backend.v3Host).toBe("https://custom-api.example.com:5558");
  });

  it("should create a backend with gateway host", async () => {
    const backend = await createBackend({
      env: "dev",
      gatewayHost: "https://my-gateway.example.com",
    });
    expect(backend).toBeDefined();
    expect(backend.gatewayHost).toBe("https://my-gateway.example.com");
  });
});
