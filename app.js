// spicyipsum

"use strict";

const express = require("express");
const path = require("path");
const logger = require("morgan");
const config = require("./lib/config");
const response = require("./lib/response");

const app = express();

app.disable("etag");
app.disable("x-powered-by");

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./views"));

app.use(logger("combined"));
app.use(express.static(path.join(__dirname, "public")));

// add some request variables as local response variables so they
// can be used in the templates and middleware.
app.use((req, res, next) => {
    res.locals.path = req.path;
    res.locals.app = config.app;
    res.locals.config = config;
    res.locals.node_env = process.env["NODE_ENV"];
    if (req.url.includes("/api") && req.method === "POST") {
        res.locals.api = true;
    }
    next();
});

const middleware = {
    fix_trailing_slashes: require("./middleware/fix_trailing_slashes"),
    block_user_agents: require("./middleware/block_user_agents"),
    enforce_ratelimits: require("./middleware/enforce_ratelimits"),
};

app.use(middleware.fix_trailing_slashes);
app.use(middleware.block_user_agents);
app.use(middleware.enforce_ratelimits);

const routes = {
    home: require("./routes/home"),
    about: require("./routes/about"),
    api: require("./routes/api"),
    default_route: require("./routes/default_route"),
};

app.use("/", routes.home);
app.use("/about", routes.about);
app.use("/api", routes.api);

// default route response
app.use(routes.default_route);

// default route error handling
app.use((err, req, res, next) => {
    console.error(`[error] ${err.stack}`);
    if (res.locals.api) {
        res.status(response.status.HTTP_INTERNAL_SERVER_ERROR.code)
            .json({
                message: response.status.HTTP_INTERNAL_SERVER_ERROR.string,
            });
    } else {
        res.status(response.status.HTTP_INTERNAL_SERVER_ERROR.code)
            .render(
                `${response.status.HTTP_INTERNAL_SERVER_ERROR.code}`,
                {
                    layout: false,
                },
            );
    }
    return;
});

module.exports = app;
