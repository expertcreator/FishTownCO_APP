/**
 * Drops console output in release builds.
 * Debug builds keep every log. Release builds hide log, info, debug, warn, and error.
 */
if (!__DEV__) {
  const noop = () => undefined;
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
}
