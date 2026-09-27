// @ts-check
/**
 * Adds Sign in with Apple entitlement on every `expo prebuild`.
 * `ios.usesAppleSignIn` alone only works when `expo-apple-authentication` is installed;
 * this app uses `@invertase/react-native-apple-authentication` but still needs the entitlement.
 */
const fs = require("node:fs");
const path = require("node:path");
const { withEntitlementsPlist } = require("@expo/config-plugins");

const APPLE_SIGN_IN_ENTITLEMENT = "com.apple.developer.applesignin";
const APPLE_SIGN_IN_VALUE = ["Default"];

const APPLE_SIGN_IN_XML = `    <key>${APPLE_SIGN_IN_ENTITLEMENT}</key>
    <array>
      <string>Default</string>
    </array>`;

/** @param {Record<string, unknown>} entitlements */
function withAppleSignInEntitlement(entitlements) {
  if (entitlements[APPLE_SIGN_IN_ENTITLEMENT]) {
    return entitlements;
  }
  return {
    ...entitlements,
    [APPLE_SIGN_IN_ENTITLEMENT]: APPLE_SIGN_IN_VALUE,
  };
}

/**
 * @param {string} iosRoot Absolute path to `ios/`
 * @returns {string[]} Patched entitlements file paths
 */
function patchIosEntitlementsForAppleSignIn(iosRoot) {
  if (!fs.existsSync(iosRoot)) {
    return [];
  }

  const patched = [];
  for (const entry of fs.readdirSync(iosRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const entitlementsPath = path.join(
      iosRoot,
      entry.name,
      `${entry.name}.entitlements`
    );
    if (!fs.existsSync(entitlementsPath)) {
      continue;
    }

    const before = fs.readFileSync(entitlementsPath, "utf8");
    if (before.includes(APPLE_SIGN_IN_ENTITLEMENT)) {
      continue;
    }

    const after = before.replace(
      /(\s*)<\/dict>\s*<\/plist>\s*$/u,
      `\n${APPLE_SIGN_IN_XML}\n$1</dict>\n</plist>\n`
    );
    if (after === before) {
      continue;
    }

    fs.writeFileSync(entitlementsPath, after);
    patched.push(entitlementsPath);
  }

  return patched;
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
function withIosAppleSignIn(config) {
  if (config.ios?.usesAppleSignIn !== true) {
    return config;
  }

  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults = withAppleSignInEntitlement(cfg.modResults);
    return cfg;
  });
}

module.exports = withIosAppleSignIn;
module.exports.patchIosEntitlementsForAppleSignIn =
  patchIosEntitlementsForAppleSignIn;