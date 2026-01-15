// fix trailing slashes

function fix_trailing_slashes (req, res, next) {
    const test = /\?[^]*\//.test(req.url);
    if (req.url.substr(-1) === "/" && req.url.length > 1 && !test) {
        res.redirect(301, req.url.slice(0, -1));
        return;
    }
    next();
};

module.exports = fix_trailing_slashes;
