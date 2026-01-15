// check for user agents that we know we don't want accessing this

const response = require("./../lib/response");

function block_user_agents (req, res, next) {
    if (res.locals.config["user_agent_blocks"]["enabled"] === 1) {
        const user_agent = req.get("User-Agent");
        for (let ua_string of res.locals.config["user_agent_blocks"]["user_agents"]) {
            ua_string = ua_string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
            const ua_string_check = new RegExp(ua_string, "i");
            if (ua_string_check.test(user_agent)) {
                if (res.locals.api) {
                    res.status(response.status.HTTP_UNACCEPTABLE.code)
                        .json({
                            message: response.status.HTTP_UNACCEPTABLE.string,
                        });
                } else {
                    res.status(response.status.HTTP_UNACCEPTABLE.code)
                        .render(
                            `${response.status.HTTP_UNACCEPTABLE.code}`,
                            {
                                layout: false,
                                message: response.status.HTTP_UNACCEPTABLE.string,
                            },
                        );
                }
                return;
            }
        }
    }
    next();
};

module.exports = block_user_agents;
