const mongoose = require('mongoose');

module.exports = mongoose.model('Ticket',require(__dirname + '/methods/ticket'));