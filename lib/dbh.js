// dbh connection initialization

const path = require("path");

const dbh = require("knex")({
    client: "sqlite3",
    connection: {
        filename: path.resolve(__dirname, "./../db/spicyipsum.sqlite3"),
    },
    useNullAsDefault: true,
    enforceForeignCheck: true,
});

module.exports = dbh;
