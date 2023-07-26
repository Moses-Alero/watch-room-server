const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const config = dotenv.config();
dotenvExpand(config);

module.exports = process.env;
