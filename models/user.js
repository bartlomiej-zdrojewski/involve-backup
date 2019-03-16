const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

module.exports = mongoose.model('User',require(__dirname + '/methods/user'));