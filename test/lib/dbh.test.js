// Unit tests for lib/dbh.js

const mockKnexInstance = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnThis(),
};

const mockKnex = jest.fn(() => mockKnexInstance);

jest.mock("knex", () => mockKnex);

describe("lib/dbh", () => {
    let dbh;

    beforeEach(() => {
        jest.resetModules();
        mockKnex.mockClear();
        mockKnex.mockReturnValue(mockKnexInstance);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("database connection initialization", () => {
        it("should create a knex instance", () => {
            dbh = require("../../lib/dbh");

            expect(mockKnex).toHaveBeenCalledTimes(1);
        });

        it("should configure knex with sqlite3 client", () => {
            dbh = require("../../lib/dbh");

            const config = mockKnex.mock.calls[0][0];
            expect(config.client).toBe("sqlite3");
        });

        it("should configure the database filename", () => {
            dbh = require("../../lib/dbh");

            const config = mockKnex.mock.calls[0][0];
            expect(config.connection).toBeDefined();
            expect(config.connection.filename).toMatch(/spicyipsum\.sqlite3$/);
        });

        it("should set the database path relative to project db directory", () => {
            dbh = require("../../lib/dbh");

            const config = mockKnex.mock.calls[0][0];
            expect(config.connection.filename).toMatch(/db\/spicyipsum\.sqlite3$/);
        });

        it("should set useNullAsDefault to true", () => {
            dbh = require("../../lib/dbh");

            const config = mockKnex.mock.calls[0][0];
            expect(config.useNullAsDefault).toBe(true);
        });

        it("should enable foreign key checks", () => {
            dbh = require("../../lib/dbh");

            const config = mockKnex.mock.calls[0][0];
            expect(config.enforceForeignCheck).toBe(true);
        });
    });

    describe("module export", () => {
        it("should export the knex instance", () => {
            dbh = require("../../lib/dbh");

            expect(dbh).toBe(mockKnexInstance);
        });
    });
});
