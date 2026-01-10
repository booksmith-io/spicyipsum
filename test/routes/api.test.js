// Unit tests for routes/api.js

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

// Mock the Words model
const mockGet = jest.fn();
jest.mock("../../models/words", () => ({
    Words: jest.fn().mockImplementation(() => ({
        get: mockGet,
    })),
}));

describe("routes/api", () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

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

        // Reset and re-mock Words
        mockGet.mockReset();
        jest.doMock("../../models/words", () => ({
            Words: jest.fn().mockImplementation(() => ({
                get: mockGet,
            })),
        }));

        app = require("../../app");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api", () => {
        it("should return 200 status", async () => {
            const response = await request(app).get("/api");

            expect(response.status).toBe(200);
        });

        it("should return HTML content type", async () => {
            const response = await request(app).get("/api");

            expect(response.type).toMatch(/html/);
        });

        it("should contain the API heading", async () => {
            const response = await request(app).get("/api");

            expect(response.text).toContain("<h2>API</h2>");
        });
    });

    describe("POST /api", () => {
        it("should return 200 status with valid request", async () => {
            mockGet.mockResolvedValue(["Test paragraph."]);

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 1, sentences: 1 })
                .set("Content-Type", "application/json");

            expect(response.status).toBe(200);
        });

        it("should return JSON content type", async () => {
            mockGet.mockResolvedValue(["Test paragraph."]);

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 1 })
                .set("Content-Type", "application/json");

            expect(response.type).toMatch(/json/);
        });

        it("should return data from the Words model", async () => {
            const mockData = ["First paragraph.", "Second paragraph."];
            mockGet.mockResolvedValue(mockData);

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 2, sentences: 1 })
                .set("Content-Type", "application/json");

            expect(response.body.data).toEqual(mockData);
        });

        it("should pass paragraphs parameter to Words model as integer", async () => {
            mockGet.mockResolvedValue(["Test."]);

            await request(app)
                .post("/api")
                .send({ paragraphs: "3" })
                .set("Content-Type", "application/json");

            expect(mockGet).toHaveBeenCalledWith(
                expect.objectContaining({ paragraphs: 3 })
            );
        });

        it("should pass sentences parameter to Words model as integer", async () => {
            mockGet.mockResolvedValue(["Test."]);

            await request(app)
                .post("/api")
                .send({ sentences: "5" })
                .set("Content-Type", "application/json");

            expect(mockGet).toHaveBeenCalledWith(
                expect.objectContaining({ sentences: 5 })
            );
        });

        it("should pass lorem parameter to Words model as integer", async () => {
            mockGet.mockResolvedValue(["Test."]);

            await request(app)
                .post("/api")
                .send({ lorem: "1" })
                .set("Content-Type", "application/json");

            expect(mockGet).toHaveBeenCalledWith(
                expect.objectContaining({ lorem: 1 })
            );
        });

        it("should pass wyrd parameter to Words model as integer", async () => {
            mockGet.mockResolvedValue(["Test."]);

            await request(app)
                .post("/api")
                .send({ wyrd: "1" })
                .set("Content-Type", "application/json");

            expect(mockGet).toHaveBeenCalledWith(
                expect.objectContaining({ wyrd: 1 })
            );
        });

        it("should return 400 status when Words model throws RangeError", async () => {
            mockGet.mockRejectedValue(new RangeError("Invalid parameter"));

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 100 })
                .set("Content-Type", "application/json");

            expect(response.status).toBe(400);
        });

        it("should return error message when Words model throws RangeError", async () => {
            mockGet.mockRejectedValue(new RangeError("The paragraphs parameter must be between 1 and 10"));

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 100 })
                .set("Content-Type", "application/json");

            expect(response.body.message).toBe("The paragraphs parameter must be between 1 and 10");
        });

        it("should return 500 status when Words model throws generic error", async () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            mockGet.mockRejectedValue(new Error("Database error"));

            const response = await request(app)
                .post("/api")
                .send({ paragraphs: 1 })
                .set("Content-Type", "application/json");

            expect(response.status).toBe(500);

            consoleSpy.mockRestore();
        });

        it("should handle empty request body", async () => {
            mockGet.mockResolvedValue(["Default paragraph."]);

            const response = await request(app)
                .post("/api")
                .send({})
                .set("Content-Type", "application/json");

            expect(response.status).toBe(200);
            expect(mockGet).toHaveBeenCalled();
        });

        it("should handle request with all parameters", async () => {
            mockGet.mockResolvedValue(["Complete test."]);

            await request(app)
                .post("/api")
                .send({
                    paragraphs: 2,
                    sentences: 3,
                    lorem: 1,
                    wyrd: 1,
                })
                .set("Content-Type", "application/json");

            expect(mockGet).toHaveBeenCalledWith({
                paragraphs: 2,
                sentences: 3,
                lorem: 1,
                wyrd: 1,
            });
        });
    });
});
