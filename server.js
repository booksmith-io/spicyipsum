// spicyipsum server
// wrapper to run the app

"use strict";

const version = "1.000";

const app = require("./app");
const config = require("./lib/config");

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
