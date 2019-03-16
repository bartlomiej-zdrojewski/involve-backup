const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

let Ticket = new mongoose.Schema({ //this is for complaints
    type: {type: String, default: 'Project'}, //type can be project or user ATM
    id: {type: String, default: ''},
    explanation: {type: String, default: ''}
});

module.exports = Ticket;