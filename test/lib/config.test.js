// Unit tests for lib/config.js

const path = require("path");

jest.mock("fs");

describe("lib/config", () => {
    let fs;

    beforeEach(() => {
        jest.resetModules();
        fs = require("fs");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("config loading", () => {
        it("should load and parse config from .spicyipsumrc", () => {
            const mockConfig = {
                app: {
                    port: 3000,
                    host: "localhost",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = require("../../lib/config");

            expect(fs.readFileSync).toHaveBeenCalledTimes(1);
            expect(fs.readFileSync).toHaveBeenCalledWith(
                expect.stringContaining(".spicyipsumrc"),
                "utf8"
            );
            expect(config.app).toEqual(mockConfig.app);
        });

        it("should read the config file from the project root", () => {
            const mockConfig = {
                app: { port: 3000 },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            require("../../lib/config");

            const calledPath = fs.readFileSync.mock.calls[0][0];
            expect(calledPath).toMatch(/\.spicyipsumrc$/);
        });
    });

    describe("config validation", () => {
        it("should throw an error when app section is missing", () => {
            const mockConfig = {
                user_agent_blocks: ["bot"],
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).toThrow("config app section is required");
        });

        it("should throw an error when config is empty object", () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({}));

            expect(() => {
                require("../../lib/config");
            }).toThrow("config app section is required");
        });

        it("should not throw when app section is present", () => {
            const mockConfig = {
                app: {},
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });
    });

    describe("config structure", () => {
        it("should preserve all config sections", () => {
            const mockConfig = {
                app: {
                    port: 8080,
                    host: "0.0.0.0",
                },
                user_agent_blocks: ["claude", "anthropic", "facebookexternalhit"],
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = require("../../lib/config");

            expect(config.app).toEqual(mockConfig.app);
            expect(config.user_agent_blocks).toEqual(mockConfig.user_agent_blocks);
        });

        it("should handle config with only app section", () => {
            const mockConfig = {
                app: { port: 3000 },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = require("../../lib/config");

            expect(config.app).toEqual(mockConfig.app);
            expect(config.user_agent_blocks).toBeUndefined();
        });
    });

    describe("error handling", () => {
        it("should throw when config file contains invalid JSON", () => {
            fs.readFileSync.mockReturnValue("{ invalid json }");

            expect(() => {
                require("../../lib/config");
            }).toThrow();
        });

        it("should propagate file read errors", () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error("ENOENT: no such file or directory");
            });

            expect(() => {
                require("../../lib/config");
            }).toThrow("ENOENT: no such file or directory");
        });
    });
});
