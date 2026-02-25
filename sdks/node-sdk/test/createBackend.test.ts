import { describe, expect, it } from "vitest";
import { createBackend } from "@/utils/createBackend";

describe("createBackend", () => {
  it("should create a backend with default options", async () => {
    const backend = await createBackend();
    expect(backend).toBeDefined();
    expect(backend.env).toBe("Dev");
  });

  it("should create a backend with a specific env", async () => {
    const backend = await createBackend({ env: "production" });
    expect(backend).toBeDefined();
    expect(backend.env).toBe("Production");
  });

  it("should create a backend with local env", async () => {
    const backend = await createBackend({ env: "local" });
    expect(backend).toBeDefined();
    expect(backend.env).toBe("Local");
  });

  it("should create a backend with gateway host", async () => {
    const backend = await createBackend({
      env: "production",
      gatewayHost: "https://my-gateway.example.com",
    });
    expect(backend).toBeDefined();
    expect(backend.env).toBe("Production");
  });

  it("should create a backend with appVersion", async () => {
    const backend = await createBackend({
      env: "dev",
      appVersion: "test/1.0.0",
    });
    expect(backend).toBeDefined();
  });

  it("should create a backend with apiUrl override", async () => {
    const backend = await createBackend({
      apiUrl: "https://custom-api.example.com:5558",
    });
    expect(backend).toBeDefined();
  });

  it("should create a backend with no optional fields", async () => {
    const backend = await createBackend({ env: "dev" });
    expect(backend).toBeDefined();
    expect(backend.env).toBe("Dev");
  });
});
