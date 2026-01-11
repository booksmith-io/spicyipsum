// spicyipsum

"use strict";

const express = require("express");
const path = require("path");
const logger = require("morgan");
const node_cache = require("node-cache");
const config = require("./lib/config");
const response = require("./lib/response");
const datetime = require("./lib/datetime");

const app = express();
const cache = new node_cache();

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

// enforce ratelimits for requests
app.use((req, res, next) => {
    const ip_address = req.ip;

    // if they don't have an IP address for the request, they're probably doing
    // shady business.  we're not into that.
    // but really, we need it to check for ratelimiting.  we can't enforce it
    // if it's not there.
    if (ip_address === undefined) {
        if (res.locals.api) {
            res.status(response.status.HTTP_BAD_REQUEST.code).json({
                message: response.status.HTTP_BAD_REQUEST.string,
            });
        }
        else {
            res.status(response.status.HTTP_BAD_REQUEST.code)
                .render(`${response.status.HTTP_BAD_REQUEST.code}`, {
                    layout: false,
                    message: response.status.HTTP_BAD_REQUEST.string,
                });
        }
        return;
    }

    const current_timestamp = datetime.current_timestamp();

    // first check if this IP is currently ratelimited.
    // this ratelimit naturally falls off once the TTL for the key is reached.
    const cache_request_ratelimit_key = `request_${ip_address}_ratelimit`;
    const cached_request_ratelimit = cache.get(cache_request_ratelimit_key);
    if (cached_request_ratelimit !== undefined) {

        // this IP is currently in a ratelimit.
        // don't do anything else for this IP until the ratelimit expires.
        if (res.locals.api) {
            res.status(response.status.HTTP_TOO_MANY_REQUESTS.code).json({
                message: response.status.HTTP_TOO_MANY_REQUESTS.string,
            });
        }
        else {
            res.status(response.status.HTTP_TOO_MANY_REQUESTS.code)
                .render(`${response.status.HTTP_TOO_MANY_REQUESTS.code}`, {
                    layout: false,
                    message: response.status.HTTP_TOO_MANY_REQUESTS.string,
                });
        }
        return;
    }

    // now check how many times they've made requests in the last second
    const cache_request_timestamp_count_key = `request_${ip_address}_${current_timestamp}`;
    let cached_request_timestamp_count = cache.take(cache_request_timestamp_count_key);
    if (cached_request_timestamp_count !== undefined) {
        if (process.env["NODE_ENV"] === 'development') {
            console.log(`[debug] '${cache_request_timestamp_count_key}' cache key was found`);
        }

        // if the current request is within the same second as the last one,
        // check if the number of requests this IP has made during this second
        // is less than 7.
        // TODO: make this value configurable through the config file
        cached_request_timestamp_count += 1;
        if (cached_request_timestamp_count > 7) {

            // if they're hitting it too much, add them to a block key.
            // expire the block after 5 minutes.
            // TODO: make the value of the blocktime configurable through the config file
            const cache_request_ratelimit_set_result = cache.set(cache_request_ratelimit_key, current_timestamp + 300, 300);
            if (cache_request_ratelimit_set_result !== undefined) {
                if (process.env["NODE_ENV"] === 'development') {
                    console.log(`[debug] '${cache_request_ratelimit_key}' cache key was set`);
                }
            }
            else {
                // return a hard error.  we need the cache key to check for ratelimiting.
                throw new Error(`'${cache_request_ratelimit_key}' cache key failed to set`);
            }

            // this IP is now being ratelimited.
            // don't do anything else for this IP until the ratelimit expires.
            if (res.locals.api) {
                res.status(response.status.HTTP_TOO_MANY_REQUESTS.code).json({
                    message: response.status.HTTP_TOO_MANY_REQUESTS.string,
                });
            }
            else {
                res.status(response.status.HTTP_TOO_MANY_REQUESTS.code)
                    .render(`${response.status.HTTP_TOO_MANY_REQUESTS.code}`, {
                        layout: false,
                        message: response.status.HTTP_TOO_MANY_REQUESTS.string,
                    });
            }
            return;
        }

        // lastly, since they aren't being ratelimited, update their entry with their current request count.
        // note, the TTL here is set to only 2 seconds.  once the current second is past this key no longer matters.
        const cache_request_timestamp_count_set_result = cache.set(cache_request_timestamp_count_key, cached_request_timestamp_count, 2);
        if (cache_request_timestamp_count_set_result !== undefined) {
            if (process.env["NODE_ENV"] === 'development') {
                console.log(`[debug] '${cache_request_timestamp_count_key}' cache key was set`);
            }
        }
        else {
            // return a hard error.  we need the cache key to check for ratelimiting.
            throw new Error(`'${cache_request_timestamp_count_key}' cache key failed to set`);
        }
    }
    else {
        // if this is the first request for the second, add a new cache key
        // starting at 1.  expire it after 2 seconds.
        const cache_request_timestamp_count_set_result = cache.set(cache_request_timestamp_count_key, 1, 2);
        if (cache_request_timestamp_count_set_result !== undefined) {
            if (process.env["NODE_ENV"] === 'development') {
                console.log(`[debug] '${cache_request_timestamp_count_key}' cache key was set`);
            }
        }
        else {
            // return a hard error.  we need the cache key to check for ratelimiting.
            throw new Error(`'${cache_request_count_timestamp_key}' cache key failed to set`);
        }
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
                    .render(`${response.status.HTTP_UNACCEPTABLE.code}`, {
                        layout: false,
                        message: response.status.HTTP_UNACCEPTABLE.string,
                    });
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
            .render(`${response.status.HTTP_NOT_FOUND.code}`, {
                layout: false,
            });
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
            .render(`${response.status.HTTP_INTERNAL_SERVER_ERROR.code}`, {
                layout: false,
            });
    }
    return;
});

module.exports = app;
