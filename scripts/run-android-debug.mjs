/**
 * Cross-platform `expo run:android` with Fishtownco brand/variant env.
 * @example bun scripts/run-android-debug.mjs development
 */
import { spawn } from "node:child_process";

const variant = process.argv[2] ?? "development";

const child = spawn("bunx", ["expo", "run:android"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    EXPO_PUBLIC_APP_VARIANT: variant,
    EXPO_PUBLIC_APP_BRAND: "fishtownco",
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", () => process.exit(1));
