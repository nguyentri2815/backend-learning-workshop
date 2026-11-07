import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  // Original Java/report audits are opt-in; the workshop test suite is portable.
  grepInvert: process.env.WORKSHOP_VERIFY_SOURCES === "1" ? undefined : /@source/,
  workers: 1,
  fullyParallel: false,
  timeout: 35_000,
  // Sourced startup playback unfolds multiple groups instead of three fixed lines.
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: process.env.PREVIEW_URL || "http://localhost:3182",
    channel: process.env.WORKSHOP_BROWSER_CHANNEL || undefined,
    viewport: { width: 1512, height: 1050 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
