#!/usr/bin/env node
/**
 * EAS / local build helper for Fishtownco (Foori-style commands, single brand).
 *
 * Usage:
 *   node scripts/build.mjs --env staging --platform android --mode eas
 *   node scripts/build.mjs --env prod --platform ios --mode eas
 *   node scripts/build.mjs --env staging --platform all --mode eas
 *   node scripts/build.mjs --env staging --platform android --mode eas --local
 */

import { spawnSync } from "node:child_process";

const ENV_ALIASES = {
  dev: "development",
  development: "development",
  staging: "staging",
  prod: "production",
  production: "production",
};

const PROFILE_BY_ENV = {
  development: "development",
  staging: "preview",
  production: "production",
};

const ALLOWED_PLATFORMS = new Set(["android", "ios", "all"]);
const ALLOWED_MODES = new Set(["eas", "update"]);

/**
 * Parses CLI argv into options.
 * @param {string[]} argv - Process arguments
 * @returns {{ env: string, platform: string, mode: string, local: boolean, dryRun: boolean }}
 */
function parseArgs(argv) {
  const out = {
    env: "staging",
    platform: "android",
    mode: "eas",
    local: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--local") {
      out.local = true;
      continue;
    }
    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (arg === "--env" || arg === "--platform" || arg === "--mode") {
      const key = arg.slice(2);
      const value = argv[++i];
      if (!value) {
        fail(`Missing value for ${arg}`);
      }
      out[key] = value;
    }
  }

  return out;
}

/**
 * Prints an error and exits.
 * @param {string} message - Error message
 * @returns {never}
 */
function fail(message) {
  console.error(`[build] ${message}`);
  process.exit(1);
}

/**
 * Runs a command or prints it in dry-run mode.
 * @param {string} command - Executable
 * @param {string[]} args - Arguments
 * @param {boolean} dryRun - When true, only print
 * @returns {void}
 */
function run(command, args, dryRun) {
  console.log(`[build] ${command} ${args.join(" ")}`);
  if (dryRun) {
    return;
  }
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const opts = parseArgs(process.argv.slice(2));
const variant = ENV_ALIASES[opts.env];
if (!variant) {
  fail(`Invalid --env ${opts.env}. Use development|staging|prod`);
}
if (!ALLOWED_PLATFORMS.has(opts.platform)) {
  fail(`Invalid --platform ${opts.platform}. Use android|ios|all`);
}
if (!ALLOWED_MODES.has(opts.mode)) {
  fail(`Invalid --mode ${opts.mode}. Use eas|update`);
}

const profile = PROFILE_BY_ENV[variant];
process.env.EXPO_PUBLIC_APP_BRAND = "fishtownco";
process.env.EXPO_PUBLIC_APP_VARIANT = variant;

if (opts.mode === "update") {
  const channel =
    variant === "development"
      ? "development"
      : `fishtownco-customer-${variant}`;
  const args = [
    "eas",
    "update",
    "--channel",
    channel,
    "--environment",
    variant === "staging" ? "preview" : variant,
    "--non-interactive",
  ];
  if (opts.platform !== "all") {
    args.push("--platform", opts.platform);
  }
  run("bunx", args, opts.dryRun);
  process.exit(0);
}

const platforms =
  opts.platform === "all" ? ["android", "ios"] : [opts.platform];

for (const platform of platforms) {
  const args = [
    "eas",
    "build",
    "--profile",
    profile,
    "--platform",
    platform,
    "--non-interactive",
  ];
  if (opts.local) {
    args.push("--local");
  }
  run("bunx", args, opts.dryRun);
}
