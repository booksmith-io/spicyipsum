// Unit tests for lib/response.js

const { status } = require("../../lib/response");

describe("lib/response", () => {
    describe("status object", () => {
        it("should export a status object", () => {
            expect(status).toBeDefined();
            expect(typeof status).toBe("object");
        });
    });

    describe("success status codes", () => {
        it("should define HTTP_OK with code 200", () => {
            expect(status.HTTP_OK).toBeDefined();
            expect(status.HTTP_OK.code).toBe(200);
            expect(status.HTTP_OK.string).toBe("OK");
        });

        it("should define HTTP_NO_CONTENT with code 204", () => {
            expect(status.HTTP_NO_CONTENT).toBeDefined();
            expect(status.HTTP_NO_CONTENT.code).toBe(204);
            expect(status.HTTP_NO_CONTENT.string).toBe("No content");
        });
    });

    describe("client error status codes", () => {
        it("should define HTTP_BAD_REQUEST with code 400", () => {
            expect(status.HTTP_BAD_REQUEST).toBeDefined();
            expect(status.HTTP_BAD_REQUEST.code).toBe(400);
            expect(status.HTTP_BAD_REQUEST.string).toBe("Something isn't correct with your request");
        });

        it("should define HTTP_UNAUTHORIZED with code 401", () => {
            expect(status.HTTP_UNAUTHORIZED).toBeDefined();
            expect(status.HTTP_UNAUTHORIZED.code).toBe(401);
            expect(status.HTTP_UNAUTHORIZED.string).toBe("You're not authenticated");
        });

        it("should define HTTP_FORBIDDEN with code 403", () => {
            expect(status.HTTP_FORBIDDEN).toBeDefined();
            expect(status.HTTP_FORBIDDEN.code).toBe(403);
            expect(status.HTTP_FORBIDDEN.string).toBe("You're not authorized to access this resource");
        });

        it("should define HTTP_NOT_FOUND with code 404", () => {
            expect(status.HTTP_NOT_FOUND).toBeDefined();
            expect(status.HTTP_NOT_FOUND.code).toBe(404);
            expect(status.HTTP_NOT_FOUND.string).toBe("That resource wasn't found");
        });

        it("should define HTTP_UNACCEPTABLE with code 406", () => {
            expect(status.HTTP_UNACCEPTABLE).toBeDefined();
            expect(status.HTTP_UNACCEPTABLE.code).toBe(406);
            expect(status.HTTP_UNACCEPTABLE.string).toBe("Fuck you");
        });

        it("should define HTTP_CONFLICT with code 409", () => {
            expect(status.HTTP_CONFLICT).toBeDefined();
            expect(status.HTTP_CONFLICT.code).toBe(409);
            expect(status.HTTP_CONFLICT.string).toBe("That resource already exists");
        });
    });

    describe("server error status codes", () => {
        it("should define HTTP_INTERNAL_SERVER_ERROR with code 500", () => {
            expect(status.HTTP_INTERNAL_SERVER_ERROR).toBeDefined();
            expect(status.HTTP_INTERNAL_SERVER_ERROR.code).toBe(500);
            expect(status.HTTP_INTERNAL_SERVER_ERROR.string).toBe("Well that's embarrassing. Something unexpected happened on our end.");
        });
    });

    describe("status code structure", () => {
        it("should have code and string properties for all status codes", () => {
            Object.keys(status).forEach((key) => {
                expect(status[key]).toHaveProperty("code");
                expect(status[key]).toHaveProperty("string");
                expect(typeof status[key].code).toBe("number");
                expect(typeof status[key].string).toBe("string");
            });
        });
    });
});
