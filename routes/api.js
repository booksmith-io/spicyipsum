// api routes

const express = require("express");
const router = express.Router();
const response = require("./../lib/response");

const model = {
    words: require("./../models/words"),
};

router.use(express.json());

router.get("/", (req, res) => {
    res.render("api", {
        layout: false,
    });
});

router.post("/", async (req, res) => {
    const params = {
        paragraphs: req.body.paragraphs,
        sentences: req.body.sentences,
        lorem: req.body.lorem,
        wyrd: req.body.wyrd,
    };

    // ensure each of the param values is an integer if set.
    // the model verifies int, so we need to be sure we're
    // passing in the right data.
    for (const [key, value] of Object.entries(params)) {
        if (value) {
            params[key] = parseInt(value, 10);
        }
    }

    const words_obj = new model.words.Words();

    let data, error;
    try {
        data = await words_obj.get(params);
    } catch (err) {
        // if we got a RangeError from the model, that means the
        // user input had an issue.
        if (err instanceof RangeError) {
            error = err["message"];
        }
        // otherwise it was a generic error, which means there was
        // an issue returned from the database.
        else {
            throw err;
        }
    }

    if (error) {
        res.status(response.status.HTTP_BAD_REQUEST.code).json({
            message: error,
        });
        return;
    }

    res.json({
        data: data,
    });
});

module.exports = router;
