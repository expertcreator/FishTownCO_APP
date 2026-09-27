const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const manifestPath = path.join(
  root,
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml"
);

const env = fs.readFileSync(envPath, "utf8");
const match = env.match(/^EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)$/m);
const key = (match?.[1] ?? "").trim();
if (!key) {
  console.error(
    "[inject-android-maps-key] missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
  );
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, "utf8");
const meta = `<meta-data android:name="com.google.android.geo.API_KEY" android:value="${key}"/>`;

if (xml.includes("com.google.android.geo.API_KEY")) {
  xml = xml.replace(
    /<meta-data android:name="com\.google\.android\.geo\.API_KEY" android:value="[^"]*"\s*\/>/,
    meta
  );
} else {
  xml = xml.replace(
    /<application\b[^>]*>/,
    (opening) => `${opening}\n    ${meta}`
  );
}

fs.writeFileSync(manifestPath, xml);
console.log(
  "[inject-android-maps-key] set com.google.android.geo.API_KEY",
  `${key.slice(0, 8)}…`
);
