// Unit tests for models/base.js

const mockInsert = jest.fn().mockResolvedValue([1]);
const mockDel = jest.fn().mockResolvedValue(1);
const mockWhere = jest.fn().mockReturnValue({ del: mockDel });

const mockDbh = jest.fn((table) => ({
    insert: mockInsert,
    where: mockWhere,
}));

jest.mock("../../lib/dbh", () => mockDbh);

describe("models/base", () => {
    let Base;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mockDbh.mockImplementation((table) => ({
            insert: mockInsert,
            where: mockWhere,
        }));

        const baseModule = require("../../models/base");
        Base = baseModule.Base;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should set dbh from lib/dbh module", () => {
            const instance = new Base();

            expect(instance.dbh).toBe(mockDbh);
        });

        it("should set _table to lowercase class name", () => {
            const instance = new Base();

            expect(instance._table).toBe("base");
        });

        it("should set _table based on child class name", () => {
            class TestModel extends Base {}
            const instance = new TestModel();

            expect(instance._table).toBe("testmodel");
        });
    });

    describe("add method", () => {
        it("should call dbh with the table name", async () => {
            const instance = new Base();
            const inserts = { name: "test" };

            await instance.add(inserts);

            expect(mockDbh).toHaveBeenCalledWith("base");
        });

        it("should call insert with the provided data", async () => {
            const instance = new Base();
            const inserts = { name: "test", value: 123 };

            await instance.add(inserts);

            expect(mockInsert).toHaveBeenCalledWith(inserts);
        });

        it("should return the result from insert", async () => {
            const instance = new Base();
            const expectedResult = [42];
            mockInsert.mockResolvedValueOnce(expectedResult);

            const result = await instance.add({ name: "test" });

            expect(result).toEqual(expectedResult);
        });

        it("should handle multiple inserts", async () => {
            const instance = new Base();
            const inserts = [
                { name: "test1" },
                { name: "test2" },
            ];

            await instance.add(inserts);

            expect(mockInsert).toHaveBeenCalledWith(inserts);
        });

        it("should use correct table for child classes", async () => {
            class Words extends Base {}
            const instance = new Words();

            await instance.add({ text: "hello" });

            expect(mockDbh).toHaveBeenCalledWith("words");
        });
    });

    describe("delete method", () => {
        it("should call dbh with the table name", async () => {
            const instance = new Base();
            const selector = { id: 1 };

            await instance.delete(selector);

            expect(mockDbh).toHaveBeenCalledWith("base");
        });

        it("should call where with the selector", async () => {
            const instance = new Base();
            const selector = { id: 1 };

            await instance.delete(selector);

            expect(mockWhere).toHaveBeenCalledWith(selector);
        });

        it("should call del after where", async () => {
            const instance = new Base();
            const selector = { id: 1 };

            await instance.delete(selector);

            expect(mockDel).toHaveBeenCalled();
        });

        it("should return the number of deleted rows", async () => {
            const instance = new Base();
            mockDel.mockResolvedValueOnce(5);

            const result = await instance.delete({ type: "old" });

            expect(result).toBe(5);
        });

        it("should handle complex selectors", async () => {
            const instance = new Base();
            const selector = { type_id: 2, active: true };

            await instance.delete(selector);

            expect(mockWhere).toHaveBeenCalledWith(selector);
        });

        it("should use correct table for child classes", async () => {
            class Words extends Base {}
            const instance = new Words();

            await instance.delete({ id: 1 });

            expect(mockDbh).toHaveBeenCalledWith("words");
        });
    });
});
