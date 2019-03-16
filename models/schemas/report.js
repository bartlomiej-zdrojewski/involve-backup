const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

let Report = new mongoose.Schema({ //this is for updating on your progress with a mentor
    projectId: {type: String, default: ''},
    reports: [],
    responses: {type: Array, default: [{date: 0, text: ''}]},
    mentors: {type: Array, default: []},
    sent: {type: Boolean, default: false}
});

module.exports = Report;