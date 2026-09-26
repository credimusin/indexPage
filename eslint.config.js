import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        // Browser modules, loaded as classic scripts and glued together through
        // the single window.imaginalOS namespace.
        files: ["static/js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...globals.es2021
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "args": "none" }],
            "no-undef": "error",
            "no-var": "error",
            "prefer-const": "warn",
            "eqeqeq": ["warn", "smart"],
            "no-console": "off",
            "no-empty": ["error", { "allowEmptyCatch": true }]
        }
    },
    {
        // Cloudflare Pages Functions run as ES modules on the edge runtime.
        files: ["functions/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.serviceworker
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "args": "none" }],
            "no-undef": "error",
            "no-var": "error",
            "prefer-const": "warn",
            "eqeqeq": ["warn", "smart"],
            "no-console": "off",
            "no-empty": ["error", { "allowEmptyCatch": true }]
        }
    }
];
