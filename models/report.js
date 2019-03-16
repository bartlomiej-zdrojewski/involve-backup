const mongoose = require('mongoose');

module.exports = mongoose.model('Report',require(__dirname + '/methods/report'));