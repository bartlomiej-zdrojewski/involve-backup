const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

let NewUserInvitation = new mongoose.Schema({
    invitedTo: {type: String, required: true},
    projectName: {type: String},
    email: {type: String, required: true},
    expires: {type: Date}
});

module.exports = NewUserInvitation;