import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname
});

const eslintConfig = [
    {
        ignores: [
            ".next/**",
            "coverage/**",
            "test-results/**",
            "playwright-report/**",
            "next-env.d.ts",
            "node_modules/**"
        ]
    },
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            "no-restricted-properties": [
                "error",
                {
                    object: "navigator",
                    property: "geolocation",
                    message: "BappaMap strictly forbids geolocation API calls."
                }
            ],
            "no-restricted-syntax": [
                "error",
                {
                    selector: "Identifier[name='GeolocateControl']",
                    message: "BappaMap strictly forbids MapLibre GeolocateControl."
                }
            ]
        }
    }
];

export default eslintConfig;
