// @ts-check
/**
 * AppsFlyer Android SDK declares `fullBackupContent` + `dataExtractionRules`, which
 * conflict with expo-secure-store. Prefer the app's (secure store) XML resources.
 * @see https://developer.android.com/build/manage-manifests#merge_conflict_markers
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const ATTRS = ['android:fullBackupContent', 'android:dataExtractionRules'];

/** @param {string | undefined} existing */
function mergeToolsReplace(existing) {
  const set = new Set(
    (existing ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  for (const a of ATTRS) {
    set.add(a);
  }
  return [...set].join(',');
}

/** @param {import('@expo/config-plugins').ExpoConfig} config */
module.exports = function withAndroidAppsFlyerBackupMerge(config) {
  return withAndroidManifest(config, (cfg) => {
    const applications = cfg.modResults.manifest.application;
    const app = Array.isArray(applications) ? applications[0] : applications;
    if (!app || typeof app !== 'object' || !('$' in app)) {
      return cfg;
    }
    const attrs = /** @type {Record<string, string>} */ (app.$);
    attrs['tools:replace'] = mergeToolsReplace(attrs['tools:replace']);
    return cfg;
  });
};
