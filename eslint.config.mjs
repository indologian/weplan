import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", ".open-next/**", "coverage/**", "cloudflare-env.d.ts"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { "group": ["@/app/**"], "message": "Application code must not import the routing layer." },
            { "group": ["@/modules/**/server/**"], "message": "Import server contracts only from server modules." }
          ]
        }
      ]
    }
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/modules/**/server/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" }
  }
]);
