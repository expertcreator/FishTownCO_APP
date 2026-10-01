/**
 * Cross-platform Android EAS / local build helper.
 *
 * - macOS / Linux + `--local`: `eas build --local` (official support)
 * - Windows: always a cloud `eas build` (EAS --local is unsupported).
 *   Cloud builds use the remote Expo keystore from eas.json (`credentialsSource: remote`).
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

if (wantLocal && isWindows) {
  console.log(
    "[eas-android-build] Windows cannot run eas build --local."
  );
  console.log(
    `[eas-android-build] Starting a cloud EAS build (profile ${profile}) so the Expo keystore is used.`
  );
}

const easArgs = [
  "eas-cli",
  "build",
  "--profile",
  profile,
  "--platform",
  "android",
  "--non-interactive",
];
if (wantLocal && !isWindows) {
  easArgs.push("--local");
}

const code = await run("bunx", easArgs, {
  SENTRY_DISABLE_AUTO_UPLOAD: "true",
});
process.exit(code);
