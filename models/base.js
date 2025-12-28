// base model for models

class Base {
    constructor() {
        this.dbh = require("./../lib/dbh");
        this._table = this.constructor.name.toLowerCase();
    }

    // the table names correspond to the model Class names
    // Class :: table
    // Words :: words

    // the child models inherit the methods below only because
    // they're vanilla in/out operations.  the get methods in
    // the models require more specifics than a well designed
    // db model interface should have, so isn't defined here
    // in the base model.
    async add (inserts) {
        return await this.dbh(this._table)
            .insert(inserts);
    };

    async delete (selector) {
        return await this.dbh(this._table)
            .where(selector)
            .del();
    };
}

module.exports.Base = Base;
