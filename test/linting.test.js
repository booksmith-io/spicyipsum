// tests for linting

const { execSync } = require("child_process");
const path = require("path");

describe("linting", () => {
    it("should pass eslint for all files", () => {
        const eslintPath = path.resolve(__dirname, "../node_modules/eslint/bin/eslint.js");
        const projectRoot = path.resolve(__dirname, "..");

        try {
            execSync(`node ${eslintPath} .`, {
                cwd: projectRoot,
                encoding: "utf8",
                stdio: "pipe",
            });
        } catch (error) {
            console.log(error.stdout);
            console.log(error.stderr);
            throw new Error("ESLint found errors");
        }
    });
});
