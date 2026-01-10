// Unit tests for routes/home.js

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

describe("routes/home", () => {
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

    describe("GET /", () => {
        it("should return 200 status", async () => {
            const response = await request(app).get("/");

            expect(response.status).toBe(200);
        });

        it("should return HTML content type", async () => {
            const response = await request(app).get("/");

            expect(response.type).toMatch(/html/);
        });

        it("should contain the ipsum form", async () => {
            const response = await request(app).get("/");

            expect(response.text).toContain("get-ipsum-form");
            expect(response.text).toContain('name="paragraphs"');
            expect(response.text).toContain('name="sentences"');
        });

        it("should contain the lorem checkbox", async () => {
            const response = await request(app).get("/");

            expect(response.text).toContain('name="lorem"');
            expect(response.text).toContain('type="checkbox"');
        });

        it("should contain the wyrd checkbox", async () => {
            const response = await request(app).get("/");

            expect(response.text).toContain('name="wyrd"');
        });

        it("should contain the generate button", async () => {
            const response = await request(app).get("/");

            expect(response.text).toContain("Generate");
        });
    });
});
