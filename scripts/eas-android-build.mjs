/**
 * Cross-platform Android EAS / local build helper.
 *
 * - macOS / Linux + `--local`: `eas build --local` (official support)
 * - Windows + `--local`: falls back to `expo run:android` (EAS local is unsupported on Windows)
 * - Without `--local`: cloud `eas build` (works on Windows)
 *
 * Usage:
 *   node scripts/eas-android-build.mjs --profile development --local
 *   node scripts/eas-android-build.mjs --profile preview
 */
import { spawn } from "node:child_process";

/**
 * Reads a CLI flag value.
 * @param {string[]} argv
 * @param {string} name
 * @returns {string | undefined}
 */
function flagValue(argv, name) {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

/**
 * Whether a boolean flag is present.
 * @param {string[]} argv
 * @param {string} name
 * @returns {boolean}
 */
function hasFlag(argv, name) {
  return argv.includes(name);
}

/**
 * Spawns a command and forwards exit code.
 * @param {string} command
 * @param {string[]} args
 * @param {NodeJS.ProcessEnv} [extraEnv]
 * @returns {Promise<number>}
 */
function run(command, args, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...extraEnv },
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

const argv = process.argv.slice(2);
const profile = flagValue(argv, "--profile") ?? "development";
const wantLocal = hasFlag(argv, "--local");
const isWindows = process.platform === "win32";

process.env.SENTRY_DISABLE_AUTO_UPLOAD ??= "true";

const variantByProfile = {
  development: "development",
  preview: "staging",
  production: "production",
  "production-apk": "production",
};

if (wantLocal && isWindows) {
  const variant = variantByProfile[profile] ?? "development";
  console.log(
    `[eas-android-build] Windows detected: EAS --local is unsupported here.`
  );
  console.log(
    `[eas-android-build] Falling back to: expo run:android (variant=${variant})`
  );
  const code = await run("bunx", ["expo", "run:android"], {
    EXPO_PUBLIC_APP_VARIANT: variant,
    EXPO_PUBLIC_APP_BRAND: "fishtownco",
    SENTRY_DISABLE_AUTO_UPLOAD: "true",
  });
  process.exit(code);
}

const easArgs = [
  "eas-cli",
  "build",
  "--profile",
  profile,
  "--platform",
  "android",
];
if (wantLocal) {
  easArgs.push("--local");
}

const code = await run("bunx", easArgs, {
  SENTRY_DISABLE_AUTO_UPLOAD: "true",
});
process.exit(code);
