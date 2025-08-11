export const progressBar = (current: number, total: number) => {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round((current / total) * barLength);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

  process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})`);

  if (current === total) {
    process.stdout.write("\n");
  }
};
