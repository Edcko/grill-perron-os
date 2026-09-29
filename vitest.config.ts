import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["./tests/unit/setup.ts"],
  },
});