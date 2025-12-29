// words model

const base = require("./base");

class Words extends base.Base {
    constructor() {
        super();
        this._types = {
            rows: [],
            obj: {},
        };
        this._words = [];
        this._get_random_word = function () {
            const index = Math.floor(Math.random() * this._words.length);
            return this._words[index]["text"];
        };
    }

    async get(params) {
        for (const param of ["paragraphs", "sentences"]) {
            if (params[param]) {
                if (!Number.isInteger(params[param]) || params[param] <= 0) {
                    throw new RangeError(`The ${param} parameter must be a positive integer`);
                }
                if (params[param] > 10) {
                    throw new RangeError(`The ${param} parameter must be between 1 and 10`);
                }
            }
        }

        for (const param of ["lorem", "wyrd"]) {
            if (params[param] && params[param] !== 0 && params[param] !== 1) {
                throw new RangeError(`The ${param} parameter must be either 0 or 1`);
            }
        }

        this._types["rows"] = await this.dbh("types")
            .select([
                "type_id",
                "name",
            ]);

        for (const row of this._types["rows"]) {
            this._types["obj"][row["name"]] = row["type_id"];
        }

        // just for good measure.  this shouldn't ever happen if the database is loaded.
        if (this._types["rows"].length === 0) {
            throw new Error(`No types were found in the database (is it setup correctly?)`);
        }

        let selector = {
            type_ids: [],
        };

        // always get the spice.
        // this isn't a Dune reference
        // but would be a lot cooler if it was.
        // that was a Dazed and Confused reference, though.
        selector["type_ids"].push(this._types["obj"]["spice"]);

        if (params["wyrd"] == 1) {
            selector["type_ids"].push(this._types["obj"]["wyrd"]);
        }

        this._words = await this.dbh("words")
            .select("text")
            .whereIn("type_id", selector["type_ids"]);

        // just for good measure.  this shouldn't ever happen if the database is loaded.
        if (this._words.length === 0) {
            throw new Error(`No words were found in the database (is it setup correctly?)`);
        }

        // now, build the data return based on the params the
        // user submitted (or the defaults).

        // the behavior of building the data is as follows:
        // 10 words per sentence.
        // 5 sentences per paragraph if not defined.
        // if lorem is defined, start the first sentence of the
        // first paragraph with "Spicy ipsum dolor amet..."
        // the data return is always an array of paragraphs.

        // TODO: words is not implemented here.  we always
        // limit to 10, regardless of the param.

        const options = {
            paragraphs: params["paragraphs"] || 1,
            sentences: params["sentences"] || 5,
            words: 10,
            lorem: params["lorem"] || 0,
        };

        let sentence = "";
        if (options["lorem"] == 1) {
            sentence = "Spicy ipsum dolor amet ";
        }

        // until the number of paragraphs
        let paragraphs = [];
        while (paragraphs.length < options["paragraphs"]) {

            // until the paragraph has the number of sentences
            let paragraph = [];
            while (paragraph.length < options["sentences"]) {

                // until the sentence has the number of words
                while (sentence.trim().split(/\s+/).length < options["words"]) {
                    sentence += `${this._get_random_word()} `;
                }

                // cleanup the string (remove extra spaces and capitalize the first)
                sentence = sentence.replace(/\s+$/g, "");
                sentence = String(sentence[0]).toUpperCase() + String(sentence).slice(1);
                paragraph.push(`${sentence}.`);
                sentence = "";
            }

            paragraphs.push(paragraph.join(" "));
            paragraph = [];
        }

        return paragraphs;
    };
}

module.exports.Words = Words;
