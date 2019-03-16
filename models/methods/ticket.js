const models = {
        project: require('./../project'),
        user: require('./../user'),
        report: require('./../report'),
        newUserInvitations: require('./../newUserInvitation')
    },
    Ticket = require('./../schemas/ticket');

module.exports = Ticket;