// functions to do datetime things

const current_timestamp = () => {
    return Math.floor(new Date().getTime() / 1000);
};

module.exports.current_timestamp = current_timestamp;
