const models = {
        project: require('./../project'),
        user: require('./../user'),
        ticket: require('./../ticket'),
        report: require('./../report')
    },
    NewUserInvitation = require('./../schemas/newUserInvitation');

module.exports = NewUserInvitation;