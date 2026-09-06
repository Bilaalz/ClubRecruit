import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Some modules under test import `@/lib/db`, which constructs a Prisma client at
    // import time. Nothing here connects, but the adapter wants a connection string.
    env: { DATABASE_URL: "postgresql://test:test@localhost:5432/test?schema=public" },
  },
});
