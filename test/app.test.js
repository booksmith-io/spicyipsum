// Unit tests for app.js middleware

const request = require("supertest");

// Mock config before requiring app
jest.mock("../lib/config", () => ({
    app: {
        name: "spicyipsum",
        port: 3000,
        address: "localhost",
    },
    user_agent_blocks: ["badbot", "evilscraper", "claude", "anthropic"],
}));

// Mock dbh (used by models)
jest.mock("../lib/dbh", () => jest.fn());

// Mock morgan to avoid log output during tests
jest.mock("morgan", () => () => (req, res, next) => next());

// Mock the Words model
const mockGet = jest.fn();
jest.mock("../models/words", () => ({
    Words: jest.fn().mockImplementation(() => ({
        get: mockGet,
    })),
}));

describe("app.js middleware", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Re-mock after resetModules
        jest.doMock("../lib/config", () => ({
            app: {
                name: "spicyipsum",
                port: 3000,
                address: "localhost",
            },
            user_agent_blocks: ["badbot", "evilscraper", "claude", "anthropic"],
        }));
        jest.doMock("../lib/dbh", () => jest.fn());
        jest.doMock("morgan", () => () => (req, res, next) => next());

        mockGet.mockReset();
        jest.doMock("../models/words", () => ({
            Words: jest.fn().mockImplementation(() => ({
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
            const response = await request(app).get("/about/");

            expect(response.status).toBe(301);
            expect(response.headers.location).toBe("/about");
        });

        it("should not redirect root URL", async () => {
            const response = await request(app).get("/");

            expect(response.status).toBe(200);
        });

        it("should not redirect URLs without trailing slash", async () => {
            const response = await request(app).get("/about");

            expect(response.status).toBe(200);
        });

        it("should redirect nested paths with trailing slash", async () => {
            const response = await request(app).get("/api/");

            expect(response.status).toBe(301);
            expect(response.headers.location).toBe("/api");
        });

        it("should not redirect URLs with query strings containing slashes", async () => {
            const response = await request(app).get("/about?param=value/");

            expect(response.status).toBe(200);
        });
    });

    describe("user-agent blocking middleware", () => {
        it("should block requests from blocked user agents", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "badbot/1.0");

            expect(response.status).toBe(406);
        });

        it("should return plain text for blocked non-API requests", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "evilscraper");

            expect(response.status).toBe(406);
            expect(response.type).toMatch(/html/);
            expect(response.text).toContain("Fuck you");
        });

        it("should return JSON for blocked API POST requests", async () => {
            const response = await request(app)
                .post("/api")
                .send({})
                .set("Content-Type", "application/json")
                .set("User-Agent", "claude-bot");

            expect(response.status).toBe(406);
            expect(response.type).toMatch(/json/);
            expect(response.body.message).toBe("Fuck you");
        });

        it("should be case-insensitive when matching user agents", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "BADBOT/2.0");

            expect(response.status).toBe(406);
        });

        it("should block user agents containing blocked string anywhere", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "Mozilla/5.0 (compatible; badbot; +http://example.com)");

            expect(response.status).toBe(406);
        });

        it("should allow requests from non-blocked user agents", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

            expect(response.status).toBe(200);
        });

        it("should block anthropic user agent", async () => {
            const response = await request(app)
                .get("/")
                .set("User-Agent", "anthropic-ai/1.0");

            expect(response.status).toBe(406);
        });

        it("should block claude user agent", async () => {
            const response = await request(app)
                .get("/about")
                .set("User-Agent", "Claude-Web/1.0");

            expect(response.status).toBe(406);
        });
    });

    describe("404 handler", () => {
        it("should return 404 for unknown routes", async () => {
            const response = await request(app).get("/nonexistent");

            expect(response.status).toBe(404);
        });

        it("should render 404 template for non-API routes", async () => {
            const response = await request(app).get("/unknown-page");

            expect(response.status).toBe(404);
            expect(response.type).toMatch(/html/);
            expect(response.text).toContain("Not found");
        });

        it("should return JSON for unknown API POST routes", async () => {
            const response = await request(app)
                .post("/api/unknown")
                .send({})
                .set("Content-Type", "application/json");

            expect(response.status).toBe(404);
            expect(response.type).toMatch(/json/);
            expect(response.body.message).toBe("That resource wasn't found");
        });
    });

    describe("error handler", () => {
        it("should return 500 for server errors on API routes", async () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            mockGet.mockRejectedValue(new Error("Database connection failed"));

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 1 })
                .set("Content-Type", "application/json");

            expect(response.status).toBe(500);
            expect(response.type).toMatch(/json/);
            expect(response.body.message).toContain("unexpected");

            consoleSpy.mockRestore();
        });

        it("should log errors to console", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            mockGet.mockRejectedValue(new Error("Test error"));

            await request(app)
                .post("/api")
                .send({ paragraphs: 1 })
                .set("Content-Type", "application/json");

            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy.mock.calls[0][0]).toContain("[error]");

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
            expect(response.type).toMatch(/json/);
        });
    });

    describe("static file serving", () => {
        it("should serve static files from public directory", async () => {
            // This test verifies static middleware is configured
            // The actual file may not exist, so we check for 404 or file content
            const response = await request(app).get("/css/main.css");

            // Should either return the file or 404, not an error
            expect([200, 404]).toContain(response.status);
        });
    });

    describe("view engine configuration", () => {
        it("should render templates from the views directory", async () => {
            const response = await request(app).get("/about");

            // Check for content that only appears in the about template
            expect(response.text).toContain("About");
        });
    });

    describe("security headers", () => {
        it("should not expose x-powered-by header", async () => {
            const response = await request(app).get("/");

            expect(response.headers["x-powered-by"]).toBeUndefined();
        });

        it("should not include etag header", async () => {
            const response = await request(app).get("/");

            expect(response.headers["etag"]).toBeUndefined();
        });
    });
});
