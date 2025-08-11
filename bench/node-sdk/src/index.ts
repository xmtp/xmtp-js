import { calculateDurationStats, printDurationStats } from "@/util/stats";
import { benchmark, createBenchWorker } from "@/util/workers";

const worker = createBenchWorker();

const results1 = await benchmark("createClient", 100);
console.log(printDurationStats(calculateDurationStats(results1)));

const results2 = await benchmark("createClient", 100, worker);
console.log(printDurationStats(calculateDurationStats(results2)));

await worker.terminate();
