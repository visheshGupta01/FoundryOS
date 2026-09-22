import { main } from "./backend/index.js";

export * from "./backend/index.js";
export * from "./brain/index.js";
export * from "./trueforge/index.js";
export * from "./databases/index.js";

main().catch((error: unknown) => {
  process.stderr.write(`Application runtime failure: ${String(error)}\n`);
  process.exit(1);
});
