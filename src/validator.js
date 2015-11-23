// include validator module
const Validator = require('ms-amqp-validation');

// initialized validator
module.exports = new Validator('../schemas');
