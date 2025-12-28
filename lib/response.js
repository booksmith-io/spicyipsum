// status codes and strings for the routes

const status = {
    // successes
    HTTP_OK: {
        code: 200,
        string: "OK",
    },
    HTTP_NO_CONTENT: {
        code: 204,
        string: "No content",
    },

    // client errors
    HTTP_BAD_REQUEST: {
        code: 400,
        string: "Something isn't correct with your request",
    },
    HTTP_UNAUTHORIZED: {
        code: 401,
        string: "You're not authenticated",
    },
    HTTP_FORBIDDEN: {
        code: 403,
        string: "You're not authorized to access this resource",
    },
    HTTP_NOT_FOUND: {
        code: 404,
        string: "That resource wasn't found",
    },
    HTTP_UNACCEPTABLE: {
        code: 406,
        string: "Fuck you",
    },
    HTTP_CONFLICT: {
        code: 409,
        string: "That resource already exists",
    },

    // server errors
    HTTP_INTERNAL_SERVER_ERROR: {
        code: 500,
        string: "Well that's embarrassing. Something unexpected happened on our end.",
    },
};

module.exports.status = status;
