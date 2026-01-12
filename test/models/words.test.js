// Unit tests for models/words.js

// Mock node-cache before requiring the module
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheTake = jest.fn();
jest.mock("node-cache", () => {
    return jest.fn().mockImplementation(() => ({
        get: mockCacheGet,
        set: mockCacheSet,
        take: mockCacheTake,
    }));
});

const mockTypes = [
    { type_id: 1, name: "spice" },
    { type_id: 2, name: "wyrd" },
];

const mockWords = [
    { text: "habanero", type_id: "1" },
    { text: "jalapeno", type_id: "1" },
    { text: "serrano", type_id: "1" },
    { text: "cayenne", type_id: "1" },
    { text: "ghost", type_id: "1" },
    { text: "reaper", type_id: "2" },  // ha, got you.  it's both spice and wyrd.
    { text: "chipotle", type_id: "1" },
    { text: "tabasco", type_id: "1" },
    { text: "poblano", type_id: "1" },
    { text: "ancho", type_id: "1" },
    { text: "magic", type_id: "2" }
];

const mockSelect = jest.fn();
const mockWhereIn = jest.fn();

const mockDbh = jest.fn((table) => {
    if (table === "types") {
        return {
            select: mockSelect.mockResolvedValue(mockTypes),
        };
    }
    if (table === "words") {
        return {
            select: jest.fn().mockReturnValue({
                whereIn: mockWhereIn.mockResolvedValue(mockWords),
            }),
        };
    }
    return {
        insert: jest.fn().mockResolvedValue([1]),
        where: jest.fn().mockReturnValue({ del: jest.fn().mockResolvedValue(1) }),
    };
});

jest.mock("../../lib/dbh", () => mockDbh);

describe("models/words", () => {
    let Words;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Reset cache mocks - default to cache miss (undefined) so DB is called
        mockCacheGet.mockReturnValue(undefined);
        mockCacheSet.mockReturnValue(true);

        mockDbh.mockImplementation((table) => {
            if (table === "types") {
                return {
                    select: mockSelect.mockResolvedValue(mockTypes),
                };
            }
            if (table === "words") {
                return {
                    select: jest.fn().mockReturnValue({
                        whereIn: mockWhereIn.mockResolvedValue(mockWords),
                    }),
                };
            }
            return {
                insert: jest.fn().mockResolvedValue([1]),
                where: jest.fn().mockReturnValue({ del: jest.fn().mockResolvedValue(1) }),
            };
        });

        const wordsModule = require("../../models/words");
        Words = wordsModule.Words;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should inherit from Base", () => {
            const instance = new Words();

            expect(instance.dbh).toBeDefined();
            expect(instance._table).toBe("words");
        });

        it("should initialize _types with empty rows and obj", () => {
            const instance = new Words();

            expect(instance._types).toEqual({
                rows: [],
                obj: {},
            });
        });

        it("should initialize _words as empty array", () => {
            const instance = new Words();

            expect(instance._words).toEqual([]);
        });

        it("should have _get_random_word function", () => {
            const instance = new Words();

            expect(typeof instance._get_random_word).toBe("function");
        });
    });

    describe("get method - parameter validation", () => {
        describe("paragraphs parameter", () => {
            it("should throw RangeError for non-integer paragraphs", async () => {
                const instance = new Words();

                await expect(instance.get({ paragraphs: 1.5 }))
                    .rejects.toThrow(RangeError);
                await expect(instance.get({ paragraphs: 1.5 }))
                    .rejects.toThrow("The paragraphs parameter must be a positive integer");
            });

            it("should throw RangeError for zero paragraphs", async () => {
                const instance = new Words();

                await expect(instance.get({ paragraphs: 0 }))
                    .rejects.toThrow(RangeError);
            });

            it("should throw RangeError for negative paragraphs", async () => {
                const instance = new Words();

                await expect(instance.get({ paragraphs: -1 }))
                    .rejects.toThrow("The paragraphs parameter must be a positive integer");
            });

            it("should throw RangeError for paragraphs greater than 10", async () => {
                const instance = new Words();

                await expect(instance.get({ paragraphs: 11 }))
                    .rejects.toThrow("The paragraphs parameter must be between 1 and 10");
            });

            it("should accept valid paragraphs values 1-10", async () => {
                const instance = new Words();

                await expect(instance.get({ paragraphs: 1 })).resolves.toBeDefined();
                await expect(instance.get({ paragraphs: 10 })).resolves.toBeDefined();
            });
        });

        describe("sentences parameter", () => {
            it("should throw RangeError for non-integer sentences", async () => {
                const instance = new Words();

                await expect(instance.get({ sentences: 2.5 }))
                    .rejects.toThrow(RangeError);
                await expect(instance.get({ sentences: 2.5 }))
                    .rejects.toThrow("The sentences parameter must be a positive integer");
            });

            it("should throw RangeError for zero sentences", async () => {
                const instance = new Words();

                await expect(instance.get({ sentences: 0 }))
                    .rejects.toThrow(RangeError);
            });

            it("should throw RangeError for negative sentences", async () => {
                const instance = new Words();

                await expect(instance.get({ sentences: -5 }))
                    .rejects.toThrow("The sentences parameter must be a positive integer");
            });

            it("should throw RangeError for sentences greater than 10", async () => {
                const instance = new Words();

                await expect(instance.get({ sentences: 15 }))
                    .rejects.toThrow("The sentences parameter must be between 1 and 10");
            });

            it("should accept valid sentences values 1-10", async () => {
                const instance = new Words();

                await expect(instance.get({ sentences: 1 })).resolves.toBeDefined();
                await expect(instance.get({ sentences: 10 })).resolves.toBeDefined();
            });
        });

        describe("lorem parameter", () => {
            it("should throw RangeError for lorem values other than 0 or 1", async () => {
                const instance = new Words();

                await expect(instance.get({ lorem: 2 }))
                    .rejects.toThrow(RangeError);
                await expect(instance.get({ lorem: 2 }))
                    .rejects.toThrow("The lorem parameter must be either 0 or 1");
            });

            it("should accept lorem value of 0", async () => {
                const instance = new Words();

                await expect(instance.get({ lorem: 0 })).resolves.toBeDefined();
            });

            it("should accept lorem value of 1", async () => {
                const instance = new Words();

                await expect(instance.get({ lorem: 1 })).resolves.toBeDefined();
            });
        });

        describe("wyrd parameter", () => {
            it("should throw RangeError for wyrd values other than 0 or 1", async () => {
                const instance = new Words();

                await expect(instance.get({ wyrd: 5 }))
                    .rejects.toThrow(RangeError);
                await expect(instance.get({ wyrd: 5 }))
                    .rejects.toThrow("The wyrd parameter must be either 0 or 1");
            });

            it("should accept wyrd value of 0", async () => {
                const instance = new Words();

                await expect(instance.get({ wyrd: 0 })).resolves.toBeDefined();
            });

            it("should accept wyrd value of 1", async () => {
                const instance = new Words();

                await expect(instance.get({ wyrd: 1 })).resolves.toBeDefined();
            });
        });
    });

    describe("get method - database interactions", () => {
        it("should fetch types from database", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockDbh).toHaveBeenCalledWith("types");
            expect(mockSelect).toHaveBeenCalledWith(["type_id", "name"]);
        });

        it("should throw error when no types found", async () => {
            mockDbh.mockImplementation((table) => {
                if (table === "types") {
                    return {
                        select: jest.fn().mockResolvedValue([]),
                    };
                }
                return { select: jest.fn() };
            });

            jest.resetModules();
            const { Words: WordsEmpty } = require("../../models/words");
            const instance = new WordsEmpty();

            await expect(instance.get({}))
                .rejects.toThrow("No types were found in the database (is it setup correctly?)");
        });

        it("should fetch words from database with spice type by default", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockDbh).toHaveBeenCalledWith("words");
            expect(mockWhereIn).toHaveBeenCalledWith("type_id", [1]);
        });

        it("should include wyrd type when wyrd param is 1", async () => {
            const instance = new Words();

            await instance.get({ wyrd: 1 });

            expect(mockWhereIn).toHaveBeenCalledWith("type_id", [1, 2]);
        });

        it("should throw error when no words found", async () => {
            mockDbh.mockImplementation((table) => {
                if (table === "types") {
                    return {
                        select: jest.fn().mockResolvedValue(mockTypes),
                    };
                }
                if (table === "words") {
                    return {
                        select: jest.fn().mockReturnValue({
                            whereIn: jest.fn().mockResolvedValue([]),
                        }),
                    };
                }
                return { select: jest.fn() };
            });

            jest.resetModules();
            const { Words: WordsEmpty } = require("../../models/words");
            const instance = new WordsEmpty();

            await expect(instance.get({}))
                .rejects.toThrow("No words were found in the database (is it setup correctly?)");
        });
    });

    describe("get method - caching behavior", () => {
        it("should check cache for types before querying database", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockCacheGet).toHaveBeenCalledWith("types_select_type_id_name");
        });

        it("should use cached types when available", async () => {
            mockCacheGet.mockImplementation((key) => {
                if (key === "types_select_type_id_name") return mockTypes;
                if (key === "types_obj") return { spice: 1, wyrd: 2 };
                if (key.startsWith("words_select_text_type_id_in_")) return mockWords;
                return undefined;
            });

            const instance = new Words();
            await instance.get({});

            // Database should not be called for types since cache returned data
            expect(mockDbh).not.toHaveBeenCalledWith("types");
        });

        it("should cache types after fetching from database", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockCacheSet).toHaveBeenCalledWith("types_select_type_id_name", mockTypes);
        });

        it("should check cache for types_obj", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockCacheGet).toHaveBeenCalledWith("types_obj");
        });

        it("should cache types_obj after building it", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockCacheSet).toHaveBeenCalledWith("types_obj", { spice: 1, wyrd: 2 });
        });

        it("should check cache for words with correct key based on type_ids", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockCacheGet).toHaveBeenCalledWith("words_select_text_type_id_in_1");
        });

        it("should include wyrd type in cache key when wyrd param is 1", async () => {
            const instance = new Words();

            await instance.get({ wyrd: 1 });

            expect(mockCacheGet).toHaveBeenCalledWith("words_select_text_type_id_in_1_2");
        });

        it("should use cached words when available", async () => {
            mockCacheGet.mockImplementation((key) => {
                if (key === "types_select_type_id_name") return mockTypes;
                if (key === "types_obj") return { spice: 1, wyrd: 2 };
                if (key === "words_select_text_type_id_in_1") return mockWords;
                return undefined;
            });

            const instance = new Words();
            await instance.get({});

            // Database should not be called for words since cache returned data
            expect(mockDbh).not.toHaveBeenCalledWith("words");
        });

        it("should cache words after fetching from database", async () => {
            const instance = new Words();

            await instance.get({});

            expect(mockCacheSet).toHaveBeenCalledWith("words_select_text_type_id_in_1", mockWords);
        });

        it("should log error when types cache set fails", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            mockCacheSet.mockImplementation((key) => {
                if (key === "types_select_type_id_name") return undefined;
                return true;
            });

            const instance = new Words();
            await instance.get({});

            expect(consoleSpy).toHaveBeenCalledWith(
                "[error] 'types_select_type_id_name' cache key failed to set"
            );

            consoleSpy.mockRestore();
        });

        it("should log error when types_obj cache set fails", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            mockCacheSet.mockImplementation((key) => {
                if (key === "types_obj") return undefined;
                return true;
            });

            const instance = new Words();
            await instance.get({});

            expect(consoleSpy).toHaveBeenCalledWith(
                "[error] 'types_obj' cache key failed to set"
            );

            consoleSpy.mockRestore();
        });

        it("should log error when words cache set fails", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            mockCacheSet.mockImplementation((key) => {
                if (key.startsWith("words_select_text_type_id_in_")) return undefined;
                return true;
            });

            const instance = new Words();
            await instance.get({});

            expect(consoleSpy).toHaveBeenCalledWith(
                "[error] 'words_select_text_type_id_in_1' cache key failed to set"
            );

            consoleSpy.mockRestore();
        });
    });

    describe("get method - output generation", () => {
        it("should return an array of paragraphs", async () => {
            const instance = new Words();

            const result = await instance.get({});

            expect(Array.isArray(result)).toBe(true);
        });

        it("should return 1 paragraph by default", async () => {
            const instance = new Words();

            const result = await instance.get({});

            expect(result.length).toBe(1);
        });

        it("should return requested number of paragraphs", async () => {
            const instance = new Words();

            const result = await instance.get({ paragraphs: 3 });

            expect(result.length).toBe(3);
        });

        it("should generate 5 sentences per paragraph by default", async () => {
            const instance = new Words();

            const result = await instance.get({});

            const sentences = result[0].split(". ");
            expect(sentences.length).toBe(5);
        });

        it("should generate requested number of sentences", async () => {
            const instance = new Words();

            const result = await instance.get({ sentences: 2 });

            const paragraph = result[0];
            const sentenceCount = (paragraph.match(/\./g) || []).length;
            expect(sentenceCount).toBe(2);
        });

        it("should capitalize first letter of each sentence", async () => {
            const instance = new Words();

            const result = await instance.get({ sentences: 1 });

            expect(result[0][0]).toMatch(/[A-Z]/);
        });

        it("should end each sentence with a period", async () => {
            const instance = new Words();

            const result = await instance.get({ sentences: 1 });

            expect(result[0]).toMatch(/\.$/);
        });

        it("should start with lorem text when lorem is 1", async () => {
            const instance = new Words();

            const result = await instance.get({ lorem: 1, sentences: 1 });

            expect(result[0]).toMatch(/^Spicy ipsum dolor amet/);
        });

        it("should not start with lorem text when lorem is 0", async () => {
            const instance = new Words();

            const result = await instance.get({ lorem: 0, sentences: 1 });

            expect(result[0]).not.toMatch(/^Spicy ipsum dolor amet/);
        });

        it("should generate paragraphs with words from the database", async () => {
            const instance = new Words();

            const result = await instance.get({ sentences: 1 });

            const wordTexts = mockWords.map(w => w.text);
            const paragraphWords = result[0].replace(/\./g, "").split(/\s+/);

            const allWordsFromDb = paragraphWords.every(word =>
                wordTexts.some(dbWord =>
                    word.toLowerCase() === dbWord.toLowerCase()
                )
            );
            expect(allWordsFromDb).toBe(true);
        });
    });

    describe("get method - defaults", () => {
        it("should use default of 1 paragraph when not specified", async () => {
            const instance = new Words();

            const result = await instance.get({});

            expect(result.length).toBe(1);
        });

        it("should use default of 5 sentences when not specified", async () => {
            const instance = new Words();

            const result = await instance.get({});

            const sentenceCount = (result[0].match(/\./g) || []).length;
            expect(sentenceCount).toBe(5);
        });

        it("should use default of no lorem when not specified", async () => {
            const instance = new Words();

            const result = await instance.get({});

            expect(result[0]).not.toMatch(/^Spicy ipsum dolor amet/);
        });

        it("should accept empty params object", async () => {
            const instance = new Words();

            await expect(instance.get({})).resolves.toBeDefined();
        });
    });

    describe("inherited methods", () => {
        it("should have add method from Base", async () => {
            const instance = new Words();

            expect(typeof instance.add).toBe("function");
        });

        it("should have delete method from Base", async () => {
            const instance = new Words();

            expect(typeof instance.delete).toBe("function");
        });
    });
});
