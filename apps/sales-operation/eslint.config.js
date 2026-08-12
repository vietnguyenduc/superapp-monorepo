import { config } from "@repo/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      // Disable rule that crashes due to typescript-eslint/ESLint version mismatch.
      "@typescript-eslint/no-unused-expressions": "off",
      "no-unused-expressions": "off",
    },
  },
  {
    ignores: ["dist", "node_modules", "build"]
  }
];
