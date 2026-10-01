// @ts-check
/**
 * Signs release APKs with the Expo keystore after `expo prebuild`.
 * Reads `credentials.json` (android.keystore) or ANDROID_KEYSTORE_* env vars.
 * Default keystore file: `@naveed.dev__fishtownco.jks` in the repo root.
 */
const { withAppBuildGradle } = require("@expo/config-plugins");

const MARKER = "// @fishtownco-android-release-signing";

const DEFS = `
${MARKER}
// Release APKs use the Expo keystore (credentials.json or ANDROID_KEYSTORE_*).
def fishtowncoRepoRoot = rootDir.getParentFile()
def fishtowncoSigningEnv = { String key ->
    def v = System.getenv(key)
    return (v != null && !v.trim().isEmpty()) ? v.trim() : null
}
def fishtowncoKeystoreFile = new File(fishtowncoRepoRoot, "@naveed.dev__fishtownco.jks")
def fishtowncoStorePassword = fishtowncoSigningEnv("ANDROID_KEYSTORE_STORE_PASSWORD")
def fishtowncoKeyPassword = fishtowncoSigningEnv("ANDROID_KEYSTORE_KEY_PASSWORD")
def fishtowncoKeyAlias = fishtowncoSigningEnv("ANDROID_KEYSTORE_KEY_ALIAS")
def fishtowncoCredFile = new File(fishtowncoRepoRoot, "credentials.json")
if (fishtowncoCredFile.exists()) {
    def fishtowncoCreds = new groovy.json.JsonSlurper().parse(fishtowncoCredFile)
    def fishtowncoKs = fishtowncoCreds?.android?.keystore
    if (fishtowncoKs != null) {
        if (fishtowncoKs.keystorePath) {
            def rel = fishtowncoKs.keystorePath.toString().replaceFirst("^[/\\\\\\\\]", "")
            def fromCred = new File(rel)
            fishtowncoKeystoreFile = fromCred.isAbsolute() ? fromCred : new File(fishtowncoRepoRoot, rel)
        }
        if (fishtowncoKs.keystorePassword) fishtowncoStorePassword = fishtowncoKs.keystorePassword.toString()
        if (fishtowncoKs.keyPassword) fishtowncoKeyPassword = fishtowncoKs.keyPassword.toString()
        if (fishtowncoKs.keyAlias) fishtowncoKeyAlias = fishtowncoKs.keyAlias.toString()
    }
}

`;

const RELEASE_CONFIG = `        release {
            storeFile fishtowncoKeystoreFile
            storePassword fishtowncoStorePassword ?: ""
            keyAlias fishtowncoKeyAlias ?: ""
            keyPassword fishtowncoKeyPassword ?: ""
        }
`;

const GUARD = `
afterEvaluate {
    def releaseTask = tasks.findByName("assembleRelease")
    if (releaseTask != null) {
        releaseTask.doFirst {
            if (!fishtowncoKeystoreFile.exists() || !fishtowncoStorePassword || !fishtowncoKeyPassword || !fishtowncoKeyAlias) {
                throw new GradleException(
                    "Release APK must be signed with the Expo keystore at " + fishtowncoKeystoreFile + ". " +
                    "Add credentials.json with android.keystore.keystorePath, keystorePassword, keyAlias, and keyPassword."
                )
            }
        }
    }
}
`;

const withAndroidReleaseSigning = (config) =>
  withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== "groovy") {
      return modConfig;
    }
    let { contents } = modConfig.modResults;
    if (contents.includes(MARKER)) {
      return modConfig;
    }

    contents = contents.replace(
      /def jscFlavor = '[^']+'\r?\n/,
      (match) => `${match}\n${DEFS}`
    );
    contents = contents.replace(
      /keyPassword 'android'\s*\}\s*\}/,
      (match) => `${match.slice(0, -1)}\n${RELEASE_CONFIG}    }`
    );
    contents = contents.replace(
      /release \{\s*\n\s*signingConfig signingConfigs\.debug/,
      "release {\n            signingConfig signingConfigs.release"
    );
    contents = contents.replace(
      /release \{\s*\/\/ Caution[\s\S]*?signingConfig signingConfigs\.debug/,
      "release {\n            signingConfig signingConfigs.release"
    );
    if (!contents.includes("assembleRelease")) {
      contents += `\n${GUARD}`;
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });

module.exports = withAndroidReleaseSigning;
