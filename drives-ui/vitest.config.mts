import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true, // Allows using 'describe' and 'it' without importing them
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
