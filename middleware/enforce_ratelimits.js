// enforce ratelimits for requests

const datetime = require("./../lib/datetime");
const response = require("./../lib/response");
const node_cache = require("node-cache");
const cache = new node_cache();

function enforce_ratelimits (req, res, next) {
    if (res.locals.config["ratelimits"]["enabled"] === 1) {
        let ip_address = req.headers["x-forwarded-for"];

        // x-forwarded-for can be spoofed, but lucky for us, the webserver
        // (at least apache as its configured on spicyipsum.com's host)
        // puts the the real IP at the last of the string.  so we just need
        // to split and trim and should be able to not worry about a spoofed
        // IP addresses here.
        if (ip_address !== undefined) {
            const ip_array = ip_address.split(",");
            if (ip_array.length > 1) {
                ip_address = ip_array[ip_array.length - 1].trim();
            }
        }

        const ip_regex = /^(((?!25?[6-9])[12]\d|[1-9])?\d\.?\b){4}$/;
        if (ip_address === undefined || !ip_address.match(ip_regex)) {
            // so... since this is an opensource project, we can't assume
            // this is running behind a proxy frontend webserver.  if
            // x-forwarded-for isn't set, or isn't a valid IP string, grab
            // the request IP.
            ip_address = req.ip;
        }

        // at this point this should never be the case.  but just in case.
        if (ip_address === undefined) {
            if (res.locals.api) {
                res.status(response.status.HTTP_BAD_REQUEST.code)
                    .json({
                        message: response.status.HTTP_BAD_REQUEST.string,
                    });
            } else {
                res.status(response.status.HTTP_BAD_REQUEST.code)
                    .render(
                        `${response.status.HTTP_BAD_REQUEST.code}`,
                        {
                            layout: false,
                            message: response.status.HTTP_BAD_REQUEST.string,
                        },
                    );
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
                res.status(response.status.HTTP_TOO_MANY_REQUESTS.code)
                    .json({
                        message: response.status.HTTP_TOO_MANY_REQUESTS.string,
                    });
            } else {
                res.status(response.status.HTTP_TOO_MANY_REQUESTS.code)
                    .render(
                        `${response.status.HTTP_TOO_MANY_REQUESTS.code}`,
                        {
                            layout: false,
                            message: response.status.HTTP_TOO_MANY_REQUESTS.string,
                        },
                    );
            }
            return;
        }

        // now check how many times they've made requests in the last second
        const cache_request_timestamp_count_key = `request_${ip_address}_${current_timestamp}`;
        let cached_request_timestamp_count = cache.get(cache_request_timestamp_count_key);
        if (cached_request_timestamp_count !== undefined) {
            if (process.env["NODE_ENV"] === "development") {
                console.log(`[debug] '${cache_request_timestamp_count_key}' cache key was found`);
            }

            // if the current request is within the same second as the last one,
            // check if the number of requests this IP has made during this second
            // is less than the configured request_threshold
            cached_request_timestamp_count += 1;
            if (cached_request_timestamp_count > res.locals.config["ratelimits"]["requests_threshold"]) {
                // if they're hitting it too much, add them to a block key.
                // expire the block after 5 minutes.
                const cache_request_ratelimit_set_result = cache.set(
                    cache_request_ratelimit_key,
                    current_timestamp + res.locals.config["ratelimits"]["block_seconds"],
                    res.locals.config["ratelimits"]["block_seconds"],
                );
                if (cache_request_ratelimit_set_result !== undefined) {
                    if (process.env["NODE_ENV"] === "development") {
                        console.log(`[debug] '${cache_request_ratelimit_key}' cache key was set`);
                    }
                } else {
                    // return a hard error.  we need the cache key to check for ratelimiting.
                    throw new Error(`'${cache_request_ratelimit_key}' cache key failed to set`);
                }

                // this IP is now being ratelimited.
                // don't do anything else for this IP until the ratelimit expires.
                if (res.locals.api) {
                    res.status(response.status.HTTP_TOO_MANY_REQUESTS.code)
                        .json({
                            message: response.status.HTTP_TOO_MANY_REQUESTS.string,
                        });
                } else {
                    res.status(response.status.HTTP_TOO_MANY_REQUESTS.code)
                        .render(
                            `${response.status.HTTP_TOO_MANY_REQUESTS.code}`,
                            {
                                layout: false,
                                message: response.status.HTTP_TOO_MANY_REQUESTS.string,
                            },
                        );
                }
                return;
            }

            // lastly, since they aren't being ratelimited, update their entry with their current request count.
            // note, the TTL here is set to only 2 seconds.  once the current second is past this key no longer matters.
            const cache_request_timestamp_count_set_result = cache.set(
                cache_request_timestamp_count_key,
                cached_request_timestamp_count,
                2,
            );
            if (cache_request_timestamp_count_set_result !== undefined) {
                if (process.env["NODE_ENV"] === "development") {
                    console.log(`[debug] '${cache_request_timestamp_count_key}' cache key was set`);
                }
            } else {
                // return a hard error.  we need the cache key to check for ratelimiting.
                throw new Error(`'${cache_request_timestamp_count_key}' cache key failed to set`);
            }
        } else {
            // if this is the first request for the second, add a new cache key
            // starting at 1.  expire it after 2 seconds.
            const cache_request_timestamp_count_set_result = cache.set(
                cache_request_timestamp_count_key,
                1,
                2,
            );
            if (cache_request_timestamp_count_set_result !== undefined) {
                if (process.env["NODE_ENV"] === "development") {
                    console.log(`[debug] '${cache_request_timestamp_count_key}' cache key was set`);
                }
            } else {
                // return a hard error.  we need the cache key to check for ratelimiting.
                throw new Error(`'${cache_request_count_timestamp_key}' cache key failed to set`);
            }
        }
    }
    next();
};

module.exports = enforce_ratelimits;
