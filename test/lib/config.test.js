// Unit tests for lib/config.js

const path = require("path");

jest.mock("fs");

describe("lib/config", () => {
    let fs;

    // Helper to create a valid config with all required sections
    const createValidConfig = (overrides = {}) => ({
        app: {
            name: "spicyipsum",
            port: 3000,
            address: "localhost",
        },
        ratelimits: {
            enabled: 0,
            requests_threshold: 7,
            block_seconds: 300,
        },
        user_agent_blocks: {
            enabled: 0,
            user_agents: ["badbot"],
        },
        analytics: {
            enabled: 0,
            snippet: "",
            about_section: "",
        },
        ...overrides,
    });

    beforeEach(() => {
        jest.resetModules();
        fs = require("fs");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("config loading", () => {
        it("should load and parse config from .spicyipsumrc", () => {
            const mockConfig = createValidConfig();

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = require("../../lib/config");

            expect(fs.readFileSync)
                .toHaveBeenCalledTimes(1);
            expect(fs.readFileSync)
                .toHaveBeenCalledWith(
                    expect.stringContaining(".spicyipsumrc"),
                    "utf8",
                );
            expect(config.app)
                .toEqual(mockConfig.app);
        });

        it("should read the config file from the project root", () => {
            const mockConfig = createValidConfig();

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            require("../../lib/config");

            const calledPath = fs.readFileSync.mock.calls[0][0];
            expect(calledPath)
                .toMatch(/\.spicyipsumrc$/);
        });
    });

    describe("config validation - app section", () => {
        it("should throw an error when app section is missing", () => {
            const mockConfig = {
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: ["bot"],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config app section is required");
        });

        it("should throw an error when config is empty object", () => {
            fs.readFileSync.mockReturnValue(JSON.stringify({}));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config app section is required");
        });

        it("should throw an error when app name is missing", () => {
            const mockConfig = {
                app: {
                    port: 3000,
                    address: "localhost",
                },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config app name section is required");
        });

        it("should throw an error when app port is missing", () => {
            const mockConfig = {
                app: {
                    name: "spicyipsum",
                    address: "localhost",
                },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config app port section is required");
        });

        it("should throw an error when app address is missing", () => {
            const mockConfig = {
                app: {
                    name: "spicyipsum",
                    port: 3000,
                },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config app address section is required");
        });
    });

    describe("config validation - ratelimits section", () => {
        it("should throw an error when ratelimits section is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits section is required");
        });

        it("should throw an error when ratelimits enabled is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits enabled is required");
        });

        it("should throw an error when ratelimits enabled is not 0 or 1", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 2,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits enabled must be either a true or false value");
        });

        it("should throw an error when ratelimits enabled is true boolean instead of 1", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: true,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits enabled must be either a true or false value");
        });

        it("should throw an error when requests_threshold is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits requests_threshold is required");
        });

        it("should throw an error when requests_threshold is not a positive integer", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    requests_threshold: 0,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits requests_threshold config section is invalid");
        });

        it("should throw an error when requests_threshold is negative", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    requests_threshold: -5,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits requests_threshold config section is invalid");
        });

        it("should throw an error when requests_threshold is a float", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    requests_threshold: 7.5,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits requests_threshold config section is invalid");
        });

        it("should throw an error when requests_threshold is a string", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    requests_threshold: "7",
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits requests_threshold config section is invalid");
        });

        it("should throw an error when block_seconds is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    requests_threshold: 7,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits block_seconds is required");
        });

        it("should throw an error when block_seconds is not a positive integer", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    requests_threshold: 7,
                    block_seconds: 0,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits block_seconds config section is invalid");
        });

        it("should throw an error when block_seconds is negative", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 1,
                    requests_threshold: 7,
                    block_seconds: -100,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config ratelimits block_seconds config section is invalid");
        });

        it("should accept ratelimits enabled as 0", () => {
            const mockConfig = createValidConfig({
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });

        it("should accept ratelimits enabled as 1", () => {
            const mockConfig = createValidConfig({
                ratelimits: {
                    enabled: 1,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });
    });

    describe("config validation - user_agent_blocks section", () => {
        it("should throw an error when user_agent_blocks section is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config user_agent_blocks section is required");
        });

        it("should throw an error when user_agent_blocks enabled is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config user_agent_blocks enabled is required");
        });

        it("should throw an error when user_agent_blocks enabled is not 0 or 1", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: "yes",
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config user_agent_blocks enabled must be either a true or false value");
        });

        it("should throw an error when user_agents is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config user_agent_blocks user_agents is required");
        });

        it("should throw an error when user_agents is not an array", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: "badbot",
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config user_agent_blocks user_agents isn't an array");
        });

        it("should throw an error when user_agents is an object", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: { bot: true },
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config user_agent_blocks user_agents isn't an array");
        });

        it("should accept user_agent_blocks enabled as 0", () => {
            const mockConfig = createValidConfig({
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });

        it("should accept user_agent_blocks enabled as 1", () => {
            const mockConfig = createValidConfig({
                user_agent_blocks: {
                    enabled: 1,
                    user_agents: ["badbot"],
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });

        it("should accept empty user_agents array", () => {
            const mockConfig = createValidConfig({
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });
    });

    describe("config validation - analytics section", () => {
        it("should throw an error when analytics section is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config analytics section is required");
        });

        it("should throw an error when analytics enabled is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config analytics enabled is required");
        });

        it("should throw an error when analytics enabled is not 0 or 1", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: "yes",
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config analytics enabled must be either a true or false value");
        });

        it("should throw an error when analytics enabled is true boolean instead of 1", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: true,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config analytics enabled must be either a true or false value");
        });

        it("should throw an error when snippet key is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config analytics snippet key is required");
        });

        it("should accept analytics enabled as 0 with empty snippet", () => {
            const mockConfig = createValidConfig({
                analytics: {
                    enabled: 0,
                    snippet: "",
                    about_section: "",
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });

        it("should throw an error when enabled is 1 and snippet key is empty", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 1,
                    snippet: "",
                    about_section: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config analytics snippet value is required");
        });

        it("should accept analytics enabled as 1 with valid snippet", () => {
            const mockConfig = createValidConfig({
                analytics: {
                    enabled: 1,
                    snippet: "<script>analytics()</script>",
                    about_section: "",
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            }).not.toThrow();
        });

        it("should throw an error when about_section key is missing", () => {
            const mockConfig = {
                app: { name: "spicyipsum", port: 3000, address: "localhost" },
                ratelimits: {
                    enabled: 0,
                    requests_threshold: 7,
                    block_seconds: 300,
                },
                user_agent_blocks: {
                    enabled: 0,
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                },
            };

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("config analytics about_section key is required");
        });
    });

    describe("config structure", () => {
        it("should preserve all config sections", () => {
            const mockConfig = createValidConfig({
                app: {
                    name: "spicyipsum",
                    port: 8080,
                    address: "0.0.0.0",
                },
                user_agent_blocks: {
                    enabled: 1,
                    user_agents: ["claude", "anthropic", "facebookexternalhit"],
                },
                analytics: {
                    enabled: 1,
                    snippet: "<script>tracking()</script>",
                    about_section: "",
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = require("../../lib/config");

            expect(config.app)
                .toEqual(mockConfig.app);
            expect(config.ratelimits)
                .toEqual(mockConfig.ratelimits);
            expect(config.user_agent_blocks)
                .toEqual(mockConfig.user_agent_blocks);
            expect(config.analytics)
                .toEqual(mockConfig.analytics);
        });

        it("should preserve custom ratelimit values", () => {
            const mockConfig = createValidConfig({
                ratelimits: {
                    enabled: 1,
                    requests_threshold: 10,
                    block_seconds: 600,
                },
            });

            fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

            const config = require("../../lib/config");

            expect(config.ratelimits.enabled)
                .toBe(1);
            expect(config.ratelimits.requests_threshold)
                .toBe(10);
            expect(config.ratelimits.block_seconds)
                .toBe(600);
        });
    });

    describe("error handling", () => {
        it("should throw when config file contains invalid JSON", () => {
            fs.readFileSync.mockReturnValue("{ invalid json }");

            expect(() => {
                require("../../lib/config");
            })
                .toThrow();
        });

        it("should propagate file read errors", () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error("ENOENT: no such file or directory");
            });

            expect(() => {
                require("../../lib/config");
            })
                .toThrow("ENOENT: no such file or directory");
        });
    });
});
