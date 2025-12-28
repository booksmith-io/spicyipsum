// application settings

const fs = require('fs');
const path = require('path');

const config = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './../.spicyipsumrc'), 'utf8'),
);

// do some light verification to make sure required values are set
if (!config.app) {
    throw 'config app section is required';
}

module.exports = config;
