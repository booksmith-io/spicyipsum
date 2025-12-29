// spicyipsum

"use strict";

const version = "0.001";

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

const routes = {
    home: require("./routes/home"),
    about: require("./routes/about"),
    api: require("./routes/api"),
};

app.use(logger("combined"));
app.use(express.static("public"));

// add some request variables as local response variables so they
// can be used in the templates.
app.use(async (req, res, next) => {
    res.locals.path = req.path;
    res.locals.app = config.app;
    res.locals.node_env = process.env["NODE_ENV"];
    if (req.url.includes("/api") && req.method === 'POST') {
        res.locals.api = true;
    }
    next();
});

// fix trailing slashes
app.use((req, res, next) => {
    const test = /\?[^]*\//.test(req.url);
    if (req.url.substr(-1) === "/" && req.url.length > 1 && !test) {
        res.redirect(301, req.url.slice(0, -1));
        return;
    } else {
        next();
    }
});

// check for user agents that we know we don't want accessing this
app.use((req, res, next) => {
    const user_agent = req.get("User-Agent");
    for (let ua_string of config.user_agent_blocks) {
        ua_string = ua_string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
        const ua_string_check = new RegExp(ua_string, "i");
        if (ua_string_check.test(user_agent)) {
            if (res.locals.api) {
                res.status(response.status.HTTP_UNACCEPTABLE.code).json({
                    message: response.status.HTTP_UNACCEPTABLE.string,
                });
            } else {
                res.status(response.status.HTTP_UNACCEPTABLE.code)
                    .header("Content-Type", "text/plain")
                    .send(response.status.HTTP_UNACCEPTABLE.string);
            }
            return;
        }
    }
    next();
});

app.use("/", routes.home);
app.use("/about", routes.about);
app.use("/api", routes.api);

// default route response
app.use((req, res) => {
    // anything else not defined in the routes above are given a 404 not found
    if (res.locals.api) {
        res.status(response.status.HTTP_NOT_FOUND.code).json({
            message: response.status.HTTP_NOT_FOUND.string,
        });
    } else {
        res.status(response.status.HTTP_NOT_FOUND.code)
            .header("Content-Type", "text/plain")
            .send(response.status.HTTP_NOT_FOUND.string);
    }
    return;
});

// default route error handling
app.use((err, req, res, next) => {
    console.error(`[error] ${err.stack}`);
    if (res.locals.api) {
        res.status(response.status.HTTP_INTERNAL_SERVER_ERROR.code).json({
            message: response.status.HTTP_INTERNAL_SERVER_ERROR.string,
        });
    } else {
        res.status(response.status.HTTP_INTERNAL_SERVER_ERROR.code)
            .header("Content-Type", "text/plain")
            .send(response.status.HTTP_INTERNAL_SERVER_ERROR.string);
    }
    return;
});

console.log(
    `[info] ${config.app.name} - version ${version}\n` +
        `[info] environment: ${process.env.NODE_ENV}`,
);

app.listen(config.app.port, config.app.address, (error) => {
    if (error) {
        throw error;
    }

    console.log(
        "[info] server started\n" +
            `[info] serving: ${config.app.address}:${config.app.port}`,
    );
});
