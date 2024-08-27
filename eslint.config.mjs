import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import stylisticTs from '@stylistic/eslint-plugin-ts'
import stylisticJs from '@stylistic/eslint-plugin-js'


export default [{
    files: ["**/*.ts"],
    ignores: ["**/out", "**/dist", "**/*.d.ts"],
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "@stylistic/ts": stylisticTs,
        "@stylistic/js": stylisticJs,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 6,
        sourceType: "module",
    },

    rules: {
        "curly": ["error", "multi-or-nest"],
        "no-lonely-if": "error",
        "@stylistic/ts/indent": ["warn", 4],
        "@stylistic/ts/brace-style": ["error", "1tbs", { "allowSingleLine": true }],

        "@stylistic/js/no-confusing-arrow": ["error", { "allowParens": false }],
        "no-return-assign": ["error", "except-parens"],  // Disallow assignment expressions in return statements

        "@stylistic/ts/padding-line-between-statements": [
            "error",
            { "blankLine": "always", "prev": "if", "next": "*" },
            { "blankLine": "never", "prev": "if", "next": "if" }
        ],

        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "off",
    },
}];
