import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // These effects intentionally synchronize client-only cookies, media
      // object URLs and form seeds after mount, so the React Compiler rule is
      // disabled for this app.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
