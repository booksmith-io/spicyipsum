// Unit tests for routes/about.js

const request = require("supertest");

// Mock config before requiring app
jest.mock("../../lib/config", () => ({
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
        user_agents: [],
    },
    analytics: {
        enabled: 0,
        snippet: "",
        about_section: "",
    },
}));

// Mock dbh (used by models)
jest.mock("../../lib/dbh", () => jest.fn());

// Mock morgan to avoid log output during tests
jest.mock("morgan", () => () => (req, res, next) => next());

describe("routes/about", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();

        // Re-mock after resetModules
        jest.doMock("../../lib/config", () => ({
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
                user_agents: [],
            },
            analytics: {
                enabled: 0,
                snippet: "",
                about_section: "",
            },
        }));
        jest.doMock("../../lib/dbh", () => jest.fn());
        jest.doMock("morgan", () => () => (req, res, next) => next());

        app = require("../../app");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /about", () => {
        it("should return 200 status", async () => {
            const response = await request(app)
                .get("/about");

            expect(response.status)
                .toBe(200);
        });

        it("should return HTML content type", async () => {
            const response = await request(app)
                .get("/about");

            expect(response.type)
                .toMatch(/html/);
        });

        it("should contain the About heading", async () => {
            const response = await request(app)
                .get("/about");

            expect(response.text)
                .toContain("<h2>About</h2>");
        });

        it("should not render about_section when empty", async () => {
            const response = await request(app)
                .get("/about");

            // The paragraph containing about_section should not be present
            // when about_section is empty
            expect(response.text)
                .not.toMatch(/<p><%- config\.analytics\.about_section %><\/p>/);
        });
    });

    describe("GET /about with about_section content", () => {
        beforeEach(() => {
            jest.resetModules();

            jest.doMock("../../lib/config", () => ({
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
                    user_agents: [],
                },
                analytics: {
                    enabled: 0,
                    snippet: "",
                    about_section: "This is custom about section content for testing.",
                },
            }));
            jest.doMock("../../lib/dbh", () => jest.fn());
            jest.doMock("morgan", () => () => (req, res, next) => next());

            app = require("../../app");
        });

        it("should render about_section content when provided", async () => {
            const response = await request(app)
                .get("/about");

            expect(response.text)
                .toContain("This is custom about section content for testing.");
        });
    });
});
