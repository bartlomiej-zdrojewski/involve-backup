const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

module.exports = mongoose.model('Project',require(__dirname + '/schemas/project'));