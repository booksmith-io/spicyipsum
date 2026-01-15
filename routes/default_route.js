// default route
// anything else not defined in the previously loaded routes
// are given a 404 not found.

const response = require("./../lib/response");

function default_route (req, res) {
    if (res.locals.api) {
        res.status(response.status.HTTP_NOT_FOUND.code)
            .json({
                message: response.status.HTTP_NOT_FOUND.string,
            });
    } else {
        res.status(response.status.HTTP_NOT_FOUND.code)
            .render(
                `${response.status.HTTP_NOT_FOUND.code}`,
                {
                    layout: false,
                },
            );
    }
    return;
};

module.exports = default_route;
