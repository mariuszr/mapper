import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.js"],
      exclude: ["**/*.d.ts"],
      all: true,
      clean: true,
    },
  },
});
