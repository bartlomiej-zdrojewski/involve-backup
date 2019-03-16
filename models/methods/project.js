const models = {
        user: require('./../user'),
        ticket: require('./../ticket'),
        report: require('./../report'),
        newUserInvitations: require('./../newUserInvitation')
    },
    Project = require('./../schemas/project');

module.exports = Project;