import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // Project overrides: relax strict TS lint errors per request
  {
    rules: {
      // Allow `any` in specific places (e.g., XR/web APIs without types)
      "@typescript-eslint/no-explicit-any": "off",
      // Permit ts-ignore comments for pragmatic interop
      "@typescript-eslint/ban-ts-comment": "off",
      // Note: warnings (like no-img-element, unused vars) are intentionally left as warnings
    },
  },
];

export default eslintConfig;
