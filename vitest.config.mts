import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

const SHARED_STATE = "tests/shop-switch.test.ts";

export default defineConfig({
  // Lets the tests import through the `@/` alias, same as the app does.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    // Files run in parallel, so a test that changes something every file
    // depends on — whether the shop takes orders at all — waits for the rest.
    projects: [
      {
        extends: true,
        test: {
          name: "main",
          include: ["tests/**/*.test.ts"],
          exclude: [SHARED_STATE],
          // Rebuilds the test database once, before any test file runs.
          globalSetup: ["./tests/support/global-setup.ts"],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: "shared-state",
          include: [SHARED_STATE],
          sequence: { groupOrder: 1 },
        },
      },
    ],
    // Runs inside every worker, before the test file is imported.
    setupFiles: ["./tests/support/env.ts"],
    // Real HTTP to a real database. The 5s default is tight for the first
    // query after a reset, when Postgres is still warming up.
    testTimeout: 20_000,
    alias: {
      // lib/products.ts is server-only Next code being pulled into a plain
      // Node process, so two Next-specific imports have to be neutralised.
      //
      // `server-only` throws unless the bundler sets the `react-server` export
      // condition. Point it at the package's own no-op build instead.
      "server-only": fromRoot("./node_modules/server-only/empty.js"),
      // cacheLife()/cacheTag() throw outside a Next render. Caching is not what
      // these tests are about. Note what is NOT stubbed: the Supabase client is
      // real, so the queries and the policies they run under are the real ones.
      "next/cache": fromRoot("./tests/support/next-cache-stub.ts"),
    },
  },
});
