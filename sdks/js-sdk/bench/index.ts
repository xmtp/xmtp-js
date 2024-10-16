import decodeSuite from "./decode";
import encodeSuite from "./encode";

const main = async () => {
  await encodeSuite();
  await decodeSuite();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
