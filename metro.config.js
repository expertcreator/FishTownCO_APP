const { getDefaultConfig } = require("expo/metro-config");

/**
 * Metro bundler config for Fishtownco.
 * Release bundles are minified and drop every console call, including payment logs.
 * Debug bundles stay unminified, so logs remain while developing.
 * @returns {import('expo/metro-config').MetroConfig} Metro config
 */
const config = getDefaultConfig(__dirname);
const minifierConfig = config.transformer.minifierConfig ?? {};
const compress = minifierConfig.compress ?? {};

config.transformer.minifierConfig = {
  ...minifierConfig,
  compress: {
    ...compress,
    drop_console: true,
  },
};

module.exports = config;
