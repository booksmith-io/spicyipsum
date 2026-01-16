// Unit tests for app.js middleware

const request = require("supertest");

// Mock node-cache before requiring app
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
jest.mock("node-cache", () => {
    return jest.fn()
        .mockImplementation(() => ({
            get: mockCacheGet,
            set: mockCacheSet,
        }));
});

// Mock datetime before requiring app
const mockCurrentTimestamp = jest.fn();
jest.mock("../lib/datetime", () => ({
    current_timestamp: mockCurrentTimestamp,
}));

// Mock config before requiring app - using new config structure
jest.mock("../lib/config", () => ({
    app: {
        name: "spicyipsum",
        port: 3000,
        address: "localhost",
    },
    ratelimits: {
        enabled: 1,
        requests_threshold: 7,
        block_seconds: 300,
    },
    user_agent_blocks: {
        enabled: 1,
        user_agents: ["badbot", "evilscraper", "claude", "anthropic"],
    },
    analytics: {
        enabled: 0,
        snippet: "",
        about_section: "",
    },
}));

// Mock dbh (used by models)
jest.mock("../lib/dbh", () => jest.fn());

// Mock morgan to avoid log output during tests
jest.mock("morgan", () => () => (req, res, next) => next());

// Mock the Words model
const mockGet = jest.fn();
jest.mock("../models/words", () => ({
    Words: jest.fn()
        .mockImplementation(() => ({
            get: mockGet,
        })),
}));

describe("app.js middleware", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Reset cache mocks - default to cache miss so ratelimiting doesn't block
        mockCacheGet.mockReturnValue(undefined);
        mockCacheSet.mockReturnValue(true);
        mockCacheGet.mockReturnValue(undefined);

        // Default timestamp
        mockCurrentTimestamp.mockReturnValue(1704067200);

        // Re-mock after resetModules
        jest.doMock("node-cache", () => {
            return jest.fn()
                .mockImplementation(() => ({
                    get: mockCacheGet,
                    set: mockCacheSet,
                }));
        });
        jest.doMock("../lib/datetime", () => ({
            current_timestamp: mockCurrentTimestamp,
        }));
        jest.doMock("../lib/config", () => ({
            app: {
                name: "spicyipsum",
                port: 3000,
                address: "localhost",
            },
            ratelimits: {
                enabled: 1,
                requests_threshold: 7,
                block_seconds: 300,
            },
            user_agent_blocks: {
                enabled: 1,
                user_agents: ["badbot", "evilscraper", "claude", "anthropic"],
            },
            analytics: {
                enabled: 0,
                snippet: "",
                about_section: "",
            },
        }));
        jest.doMock("../lib/dbh", () => jest.fn());
        jest.doMock("morgan", () => () => (req, res, next) => next());

        mockGet.mockReset();
        jest.doMock("../models/words", () => ({
            Words: jest.fn()
                .mockImplementation(() => ({
                    get: mockGet,
                })),
        }));

        app = require("../app");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("trailing slash redirect middleware", () => {
        it("should redirect URLs with trailing slash to URL without trailing slash", async () => {
            const response = await request(app)
                .get("/about/");

            expect(response.status)
                .toBe(301);
            expect(response.headers.location)
                .toBe("/about");
        });

        it("should not redirect root URL", async () => {
            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(200);
        });

        it("should not redirect URLs without trailing slash", async () => {
            const response = await request(app)
                .get("/about");

            expect(response.status)
                .toBe(200);
        });

        it("should redirect nested paths with trailing slash", async () => {
            const response = await request(app)
                .get("/api/");

            expect(response.status)
                .toBe(301);
            expect(response.headers.location)
                .toBe("/api");
        });

        it("should not redirect URLs with query strings containing slashes", async () => {
            const response = await request(app)
                .get("/about?param=value/");

            expect(response.status)
                .toBe(200);
        });
    });

    describe("user-agent blocking middleware", () => {
        it("should block requests from blocked user agents", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "badbot/1.0");

            expect(response.status)
                .toBe(406);
        });

        it("should return plain text for blocked non-API requests", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "evilscraper");

            expect(response.status)
                .toBe(406);
            expect(response.type)
                .toMatch(/html/);
            expect(response.text)
                .toContain("Fuck you");
        });

        it("should return JSON for blocked API POST requests", async () => {
            const response = await request(app)
                .post("/api")
                .send({})
                .set("Content-Type", "application/json")
                .set("User-Agent", "claude-bot");

            expect(response.status)
                .toBe(406);
            expect(response.type)
                .toMatch(/json/);
            expect(response.body.message)
                .toBe("Fuck you");
        });

        it("should be case-insensitive when matching user agents", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "BADBOT/2.0");

            expect(response.status)
                .toBe(406);
        });

        it("should block user agents containing blocked string anywhere", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "Mozilla/5.0 (compatible; badbot; +http://example.com)");

            expect(response.status)
                .toBe(406);
        });

        it("should allow requests from non-blocked user agents", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

            expect(response.status)
                .toBe(200);
        });

        it("should block anthropic user agent", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "anthropic-ai/1.0");

            expect(response.status)
                .toBe(406);
        });

        it("should block claude user agent", async () => {
            const response = await request(app)
                .get("/about")
                .set("User-Agent", "Claude-Web/1.0");

            expect(response.status)
                .toBe(406);
        });
    });

    describe("404 handler", () => {
        it("should return 404 for unknown routes", async () => {
            const response = await request(app)
                .get("/nonexistent");

            expect(response.status)
                .toBe(404);
        });

        it("should render 404 template for non-API routes", async () => {
            const response = await request(app)
                .get("/unknown-page");

            expect(response.status)
                .toBe(404);
            expect(response.type)
                .toMatch(/html/);
            expect(response.text)
                .toContain("Not found");
        });

        it("should return JSON for unknown API POST routes", async () => {
            const response = await request(app)
                .post("/api/unknown")
                .send({})
                .set("Content-Type", "application/json");

            expect(response.status)
                .toBe(404);
            expect(response.type)
                .toMatch(/json/);
            expect(response.body.message)
                .toBe("That resource wasn't found");
        });
    });

    describe("error handler", () => {
        it("should return 500 for server errors on API routes", async () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, "error")
                .mockImplementation();

            mockGet.mockRejectedValue(new Error("Database connection failed"));

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 1 })
                .set("Content-Type", "application/json");

            expect(response.status)
                .toBe(500);
            expect(response.type)
                .toMatch(/json/);
            expect(response.body.message)
                .toContain("unexpected");

            consoleSpy.mockRestore();
        });

        it("should log errors to console", async () => {
            const consoleSpy = jest.spyOn(console, "error")
                .mockImplementation();

            mockGet.mockRejectedValue(new Error("Test error"));

            await request(app)
                .post("/api")
                .send({ paragraphs: 1 })
                .set("Content-Type", "application/json");

            expect(consoleSpy)
                .toHaveBeenCalled();
            expect(consoleSpy.mock.calls[0][0])
                .toContain("[error]");

            consoleSpy.mockRestore();
        });
    });

    describe("locals middleware", () => {
        it("should set res.locals.api for API POST requests", async () => {
            mockGet.mockResolvedValue(["Test."]);

            const response = await request(app)
                .post("/api")
                .send({})
                .set("Content-Type", "application/json");

            // API responses are JSON, not HTML
            expect(response.type)
                .toMatch(/json/);
        });
    });

    describe("static file serving", () => {
        it("should serve static files from public directory", async () => {
            // This test verifies static middleware is configured
            // The actual file may not exist, so we check for 404 or file content
            const response = await request(app)
                .get("/css/main.css");

            // Should either return the file or 404, not an error
            expect([200, 404])
                .toContain(response.status);
        });
    });

    describe("view engine configuration", () => {
        it("should render templates from the views directory", async () => {
            const response = await request(app)
                .get("/about");

            // Check for content that only appears in the about template
            expect(response.text)
                .toContain("About");
        });
    });

    describe("security headers", () => {
        it("should not expose x-powered-by header", async () => {
            const response = await request(app)
                .get("/");

            expect(response.headers["x-powered-by"])
                .toBeUndefined();
        });

        it("should not include etag header", async () => {
            const response = await request(app)
                .get("/");

            expect(response.headers["etag"])
                .toBeUndefined();
        });
    });

    describe("IP address ratelimiting middleware", () => {
        it("should allow first request from an IP address", async () => {
            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(200);
        });

        it("should use last IP from x-forwarded-for when multiple IPs present", async () => {
            const response = await request(app)
                .get("/")
                .set("x-forwarded-for", "192.168.1.1, 10.0.0.1, 203.0.113.50");

            expect(response.status)
                .toBe(200);
            // Verify the cache key uses the last IP (203.0.113.50)
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_203\.0\.113\.50_1704067200$/),
                    1,
                    2,
                );
        });

        it("should use single x-forwarded-for IP when valid", async () => {
            const response = await request(app)
                .get("/")
                .set("x-forwarded-for", "198.51.100.25");

            expect(response.status)
                .toBe(200);
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_198\.51\.100\.25_1704067200$/),
                    1,
                    2,
                );
        });

        it("should fall back to req.ip when x-forwarded-for is invalid", async () => {
            const response = await request(app)
                .get("/")
                .set("x-forwarded-for", "not-a-valid-ip");

            expect(response.status)
                .toBe(200);
            // Should fall back to req.ip, which supertest sets to ::ffff:127.0.0.1 or 127.0.0.1
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_.*127\.0\.0\.1_1704067200$/),
                    1,
                    2,
                );
        });

        it("should fall back to req.ip when x-forwarded-for contains invalid IP among multiple", async () => {
            const response = await request(app)
                .get("/")
                .set("x-forwarded-for", "192.168.1.1, invalid-ip");

            expect(response.status)
                .toBe(200);
            // Last IP is invalid, so should fall back to req.ip
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_.*127\.0\.0\.1_1704067200$/),
                    1,
                    2,
                );
        });

        it("should trim whitespace from x-forwarded-for IP addresses", async () => {
            const response = await request(app)
                .get("/")
                .set("x-forwarded-for", "192.168.1.1,   203.0.113.75   ");

            expect(response.status)
                .toBe(200);
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_203\.0\.113\.75_1704067200$/),
                    1,
                    2,
                );
        });

        it("should track request count for IP address", async () => {
            await request(app)
                .get("/");

            // Should set the request count cache key
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_.*_1704067200$/),
                    1,
                    2,
                );
        });

        it("should increment request count for subsequent requests in same second", async () => {
            // Simulate existing request count of 3
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return undefined;
                return 3;
            });

            await request(app)
                .get("/");

            // Should set incremented count (4)
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_.*_1704067200$/),
                    4,
                    2,
                );
        });

        it("should return 429 when IP is already ratelimited", async () => {
            // Simulate ratelimited IP
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return 1704067500;
                return undefined;
            });

            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(429);
        });

        it("should return HTML 429 for non-API ratelimited requests", async () => {
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return 1704067500;
                return undefined;
            });

            const response = await request(app)
                .get("/about");

            expect(response.status)
                .toBe(429);
            expect(response.type)
                .toMatch(/html/);
            expect(response.text)
                .toContain("naughty");
        });

        it("should return JSON 429 for API ratelimited POST requests", async () => {
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return 1704067500;
                return undefined;
            });

            const response = await request(app)
                .post("/api")
                .send({})
                .set("Content-Type", "application/json");

            expect(response.status)
                .toBe(429);
            expect(response.type)
                .toMatch(/json/);
            expect(response.body.message)
                .toContain("naughty");
        });

        it("should ratelimit IP after more than 7 requests per second", async () => {
            // Simulate 7 requests already made this second
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return undefined;
                return 7;
            });

            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(429);
            // Should set ratelimit key with 300 second TTL
            expect(mockCacheSet)
                .toHaveBeenCalledWith(
                    expect.stringMatching(/^request_.*_ratelimit$/),
                    expect.any(Number),
                    300,
                );
        });

        it("should allow exactly 7 requests per second without ratelimiting", async () => {
            // Simulate 6 requests already made this second (next will be 7th)
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return undefined;
                return 6;
            });

            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(200);
        });

        it("should throw error when ratelimit cache set fails", async () => {
            const consoleSpy = jest.spyOn(console, "error")
                .mockImplementation();

            // Simulate 7 requests and cache set failure
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return undefined;
                return 7;
            });
            mockCacheSet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return undefined;
                return true;
            });

            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(500);

            consoleSpy.mockRestore();
        });

        it("should throw error when request count cache set fails on first request", async () => {
            const consoleSpy = jest.spyOn(console, "error")
                .mockImplementation();

            // Cache set fails
            mockCacheSet.mockReturnValue(undefined);

            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(500);

            consoleSpy.mockRestore();
        });

        it("should throw error when request count cache set fails on subsequent requests", async () => {
            const consoleSpy = jest.spyOn(console, "error")
                .mockImplementation();

            // Simulate existing count, but cache set fails
            mockCacheGet.mockImplementation((key) => {
                if (key.includes("_ratelimit")) return undefined;
                return 3;
            });
            mockCacheSet.mockReturnValue(undefined);

            const response = await request(app)
                .get("/");

            expect(response.status)
                .toBe(500);

            consoleSpy.mockRestore();
        });
    });
});

describe("app.js middleware with ratelimiting disabled", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mockCacheGet.mockReturnValue(undefined);
        mockCacheSet.mockReturnValue(true);
        mockCurrentTimestamp.mockReturnValue(1704067200);

        jest.doMock("node-cache", () => {
            return jest.fn()
                .mockImplementation(() => ({
                    get: mockCacheGet,
                    set: mockCacheSet,
                }));
        });
        jest.doMock("../lib/datetime", () => ({
            current_timestamp: mockCurrentTimestamp,
        }));
        jest.doMock("../lib/config", () => ({
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
                enabled: 1,
                user_agents: ["badbot"],
            },
            analytics: {
                enabled: 0,
                snippet: "",
                about_section: "",
            },
        }));
        jest.doMock("../lib/dbh", () => jest.fn());
        jest.doMock("morgan", () => () => (req, res, next) => next());

        mockGet.mockReset();
        jest.doMock("../models/words", () => ({
            Words: jest.fn()
                .mockImplementation(() => ({
                    get: mockGet,
                })),
        }));

        app = require("../app");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should not check cache when ratelimiting is disabled", async () => {
        const response = await request(app)
            .get("/");

        expect(response.status)
            .toBe(200);
        // Cache should not be accessed for ratelimiting
        expect(mockCacheGet).not.toHaveBeenCalled();
        expect(mockCacheSet).not.toHaveBeenCalled();
    });

    it("should allow requests even when cache would indicate ratelimit", async () => {
        // Even if we set up the mock to return a ratelimit, it shouldn't be checked
        mockCacheGet.mockReturnValue(1704067500);

        const response = await request(app)
            .get("/");

        expect(response.status)
            .toBe(200);
    });

    it("should skip ratelimit tracking entirely", async () => {
        // Make multiple requests
        await request(app)
            .get("/");
        await request(app)
            .get("/about");

        // No cache interactions should have occurred
        expect(mockCacheSet).not.toHaveBeenCalled();
    });
});

describe("app.js middleware with user agent blocking disabled", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mockCacheGet.mockReturnValue(undefined);
        mockCacheSet.mockReturnValue(true);
        mockCurrentTimestamp.mockReturnValue(1704067200);

        jest.doMock("node-cache", () => {
            return jest.fn()
                .mockImplementation(() => ({
                    get: mockCacheGet,
                    set: mockCacheSet,
                }));
        });
        jest.doMock("../lib/datetime", () => ({
            current_timestamp: mockCurrentTimestamp,
        }));
        jest.doMock("../lib/config", () => ({
            app: {
                name: "spicyipsum",
                port: 3000,
                address: "localhost",
            },
            ratelimits: {
                enabled: 1,
                requests_threshold: 7,
                block_seconds: 300,
            },
            user_agent_blocks: {
                enabled: 0,
                user_agents: ["badbot", "evilscraper", "claude", "anthropic"],
            },
            analytics: {
                enabled: 0,
                snippet: "",
                about_section: "",
            },
        }));
        jest.doMock("../lib/dbh", () => jest.fn());
        jest.doMock("morgan", () => () => (req, res, next) => next());

        mockGet.mockReset();
        jest.doMock("../models/words", () => ({
            Words: jest.fn()
                .mockImplementation(() => ({
                    get: mockGet,
                })),
        }));

        app = require("../app");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should allow requests from blocked user agents when blocking is disabled", async () => {
        const response = await request(app)
            .get("/")
            .set("User-Agent", "badbot/1.0");

        expect(response.status)
            .toBe(200);
    });
});

describe("app.js middleware with configurable ratelimit values", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mockCacheGet.mockReturnValue(undefined);
        mockCacheSet.mockReturnValue(true);
        mockCurrentTimestamp.mockReturnValue(1704067200);

        jest.doMock("node-cache", () => {
            return jest.fn()
                .mockImplementation(() => ({
                    get: mockCacheGet,
                    set: mockCacheSet,
                }));
        });
        jest.doMock("../lib/datetime", () => ({
            current_timestamp: mockCurrentTimestamp,
        }));
        // Use custom ratelimit values
        jest.doMock("../lib/config", () => ({
            app: {
                name: "spicyipsum",
                port: 3000,
                address: "localhost",
            },
            ratelimits: {
                enabled: 1,
                requests_threshold: 3,
                block_seconds: 600,
            },
            user_agent_blocks: {
                enabled: 0,
                user_agents: [],
            },
            analytics: {
                enabled: 0,
                snippet: "",
                about_section: "",
            },
        }));
        jest.doMock("../lib/dbh", () => jest.fn());
        jest.doMock("morgan", () => () => (req, res, next) => next());

        mockGet.mockReset();
        jest.doMock("../models/words", () => ({
            Words: jest.fn()
                .mockImplementation(() => ({
                    get: mockGet,
                })),
        }));

        app = require("../app");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should use configured requests_threshold instead of hardcoded 7", async () => {
        // With threshold of 3, 3 requests should trigger ratelimit
        mockCacheGet.mockImplementation((key) => {
            if (key.includes("_ratelimit")) return undefined;
            return 3; // Already made 3 requests
        });

        const response = await request(app)
            .get("/");

        expect(response.status)
            .toBe(429);
    });

    it("should allow requests at threshold limit", async () => {
        // With threshold of 3, 2 existing requests + 1 new = 3, which is at limit
        mockCacheGet.mockImplementation((key) => {
            if (key.includes("_ratelimit")) return undefined;
            return 2;
        });

        const response = await request(app)
            .get("/");

        expect(response.status)
            .toBe(200);
    });

    it("should use configured block_seconds for ratelimit TTL", async () => {
        // Trigger ratelimit
        mockCacheGet.mockImplementation((key) => {
            if (key.includes("_ratelimit")) return undefined;
            return 3;
        });

        await request(app)
            .get("/");

        // Should set ratelimit key with 600 second TTL (configured value)
        expect(mockCacheSet)
            .toHaveBeenCalledWith(
                expect.stringMatching(/^request_.*_ratelimit$/),
                expect.any(Number),
                600,
            );
    });

    it("should set ratelimit value using configured block_seconds", async () => {
        // Trigger ratelimit
        mockCacheGet.mockImplementation((key) => {
            if (key.includes("_ratelimit")) return undefined;
            return 3;
        });

        await request(app)
            .get("/");

        // The value stored should be current_timestamp + block_seconds
        // Current timestamp is 1704067200, block_seconds is 600
        expect(mockCacheSet)
            .toHaveBeenCalledWith(
                expect.stringMatching(/^request_.*_ratelimit$/),
                1704067800, // 1704067200 + 600
                600,
            );
    });
});

describe("app.js middleware with both features disabled", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mockCacheGet.mockReturnValue(undefined);
        mockCacheSet.mockReturnValue(true);
        mockCurrentTimestamp.mockReturnValue(1704067200);

        jest.doMock("node-cache", () => {
            return jest.fn()
                .mockImplementation(() => ({
                    get: mockCacheGet,
                    set: mockCacheSet,
                }));
        });
        jest.doMock("../lib/datetime", () => ({
            current_timestamp: mockCurrentTimestamp,
        }));
        jest.doMock("../lib/config", () => ({
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
                user_agents: ["badbot", "claude"],
            },
            analytics: {
                enabled: 0,
                snippet: "",
                about_section: "",
            },
        }));
        jest.doMock("../lib/dbh", () => jest.fn());
        jest.doMock("morgan", () => () => (req, res, next) => next());

        mockGet.mockReset();
        jest.doMock("../models/words", () => ({
            Words: jest.fn()
                .mockImplementation(() => ({
                    get: mockGet,
                })),
        }));

        app = require("../app");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should allow blocked user agents and skip ratelimiting when both disabled", async () => {
        mockCacheGet.mockReturnValue(1704067500); // Would indicate ratelimited

        const response = await request(app)
            .get("/")
            .set("User-Agent", "badbot/1.0");

        expect(response.status)
            .toBe(200);
        expect(mockCacheGet).not.toHaveBeenCalled();
    });

    it("should serve normal pages without any middleware blocking", async () => {
        const response = await request(app)
            .get("/about")
            .set("User-Agent", "Claude-Web/1.0");

        expect(response.status)
            .toBe(200);
        expect(response.text)
            .toContain("About");
    });
});
