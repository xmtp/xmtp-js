import { benchmark, createBenchWorker } from "@/util/bench";

const worker = createBenchWorker();

await benchmark("Client.create", 100);
await benchmark("Client.create", 100, worker);

await worker.terminate();
