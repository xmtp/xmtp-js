import { generateTestClients } from "@/util/xmtp";

await generateTestClients(1000, {
  env: "local",
});
