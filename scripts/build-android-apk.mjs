/**
 * Builds a local Android APK and places it in the project root
 * (same idea as `eas build --local` on the customer app: `xxxx-yyyy.apk`).
 *
 * Windows-safe: uses Gradle assemble (EAS --local is unsupported on Windows).
 *
 * @example bun scripts/build-android-apk.mjs
 * @example bun scripts/build-android-apk.mjs --release
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const androidDir = path.join(root, "android");
const gradlew =
  process.platform === "win32"
    ? path.join(androidDir, "gradlew.bat")
    : path.join(androidDir, "gradlew");
const wantRelease = process.argv.includes("--release");
const task = wantRelease ? "assembleRelease" : "assembleDebug";
const builtRelative = wantRelease
  ? path.join("app", "build", "outputs", "apk", "release", "app-release.apk")
  : path.join("app", "build", "outputs", "apk", "debug", "app-debug.apk");

/**
 * EAS-local style short id, e.g. `a1b2c3d4-e5f6`.
 * @returns {string}
 */
function easStyleApkName() {
  const a = crypto.randomBytes(4).toString("hex");
  const b = crypto.randomBytes(3).toString("hex");
  return `${a}-${b}.apk`;
}

/**
 * Runs a command in a directory.
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<number>}
 */
function run(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        EXPO_PUBLIC_APP_BRAND: process.env.EXPO_PUBLIC_APP_BRAND ?? "fishtownco",
        EXPO_PUBLIC_APP_VARIANT:
          process.env.EXPO_PUBLIC_APP_VARIANT ?? "development",
        SENTRY_DISABLE_AUTO_UPLOAD: "true",
      },
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

if (!fs.existsSync(gradlew)) {
  console.log("[apk] android/ missing — running expo prebuild…");
  const prebuildCode = await run(
    "bunx",
    ["expo", "prebuild", "--platform", "android", "--no-install"],
    root
  );
  if (prebuildCode !== 0) {
    console.error("[apk] prebuild failed");
    process.exit(prebuildCode);
  }
}

console.log(`[apk] Building ${task} (APK will land in project root)…`);
const buildCode = await run(gradlew, [`:app:${task}`], androidDir);
if (buildCode !== 0) {
  console.error(`[apk] Gradle ${task} failed`);
  process.exit(buildCode);
}

const builtApk = path.join(androidDir, builtRelative);
if (!fs.existsSync(builtApk)) {
  // Some release configs emit unsigned / renamed APKs — search folder.
  const folder = path.dirname(builtApk);
  const found = fs.existsSync(folder)
    ? fs.readdirSync(folder).find((f) => f.endsWith(".apk"))
    : undefined;
  if (!found) {
    console.error(`[apk] APK not found under ${folder}`);
    process.exit(1);
  }
  const src = path.join(folder, found);
  const dest = path.join(root, easStyleApkName());
  fs.copyFileSync(src, dest);
  printDone(dest);
  process.exit(0);
}

const dest = path.join(root, easStyleApkName());
fs.copyFileSync(builtApk, dest);
printDone(dest);

/**
 * Prints the final APK path.
 * @param {string} dest
 * @returns {void}
 */
function printDone(dest) {
  console.log("");
  console.log("[apk] Done — same as customer-app local EAS artifact:");
  console.log(`  ${dest}`);
  console.log("");
  if (process.platform === "win32") {
    console.log(`Open folder: explorer "${root}"`);
  }
}
