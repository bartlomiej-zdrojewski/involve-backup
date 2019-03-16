const models = {
        project: require('./../project'),
        user: require('./../user'),
        ticket: require('./../ticket'),
        newUserInvitations: require('./../newUserInvitation')
    },
    Report = require('./../schemas/report');

module.exports = Report;