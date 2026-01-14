import stylistic from "@stylistic/eslint-plugin";

export default [
    {
        "ignores": [
            "public/src/**",
            "package.json",
            "package-lock.json",
        ],
        "rules": {
            "indent": ["error", 4],
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
            "comma-dangle": ["error", "always-multiline"],
            "object-curly-spacing": ["error", "always"],
            "arrow-parens": ["error", "always"],
            "max-len": ["error", { "code": 140 }],
            "linebreak-style": ["error", "unix"],
            "newline-per-chained-call": ["error", { "ignoreChainWithDepth": 1 }],
            "space-before-function-paren": ["error", "always"],
        },
    },
];
