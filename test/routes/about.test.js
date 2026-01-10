// Unit tests for routes/about.js

const request = require("supertest");

// Mock config before requiring app
jest.mock("../../lib/config", () => ({
    app: {
        name: "spicyipsum",
        port: 3000,
        address: "localhost",
    },
    user_agent_blocks: [],
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
            user_agent_blocks: [],
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
            const response = await request(app).get("/about");

            expect(response.status).toBe(200);
        });

        it("should return HTML content type", async () => {
            const response = await request(app).get("/about");

            expect(response.type).toMatch(/html/);
        });

        it("should contain the About heading", async () => {
            const response = await request(app).get("/about");

            expect(response.text).toContain("<h2>About</h2>");
        });
    });
});
