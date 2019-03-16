const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

let Project = new mongoose.Schema({
        title: {type: String, default: ''},
        leader: {type: String, default: ''},
        mentor: {type: String, default: ''},
        members: [{
            // name: String,
            // surname: String,
            id: String,
            online: {type: Boolean, default: false},
            wasNotified: {type: Boolean, default: false}
        }],
        chatHistory: [{
            date: Date,
            name: String,
            surname: String,
            id: String,
            messages: {type: Array, default: []} //<-- zdroidowy obiekt, zapisywany tak jak jest
        }],

        lastChatMessageFrom: {type: String, default: ''},

        invitations: [{
            date: Date,
            email: String,
            name: String,
            surname: String,
        }],

        applications: [{
            id: String,
            description: String,
            explanation: String,
            roles: [{
                role: String,
                accepted: Boolean
            }], //nazwy ról MUSZĄ BYC UNIKALNE
            //member: Boolean
        }],

        city: {type: String, default: ''},
        depiction: {type: String, default: ''},
        description: {type: String, default: ''},
        media: {type: Array, default: []},

        roles: [{
            title: String,
            description: String,
            recruitment: Boolean,
            skill: String,
            members: [String]
        }],
        responses: [{
            for: String,
            title: String,
            text: String
        }],

        filters: {type: Object, default: {} },
        image: {type: String, default: 'default'},
        favourite: {type: Boolean, default: false},
        hash: {type: String, default: ''},
        isCase: Boolean,
        caseId: String,
        closure: {
            requested: Boolean,
            requestedOn: Date,
            requestedReason: String,    // powód, z którego lider prosi o zamknięcie projektu

            closed: Boolean,
            projectSuccessful: Boolean, // czy lider oznaczył projekt jako udany
            successReason: String,      // powód podany przez lidera przy oznaczeniu projektu jako udany/nieudany
            closedOn: Date
        },
        createdOn: {type: Date, default: new Date()},

    }
    , {
        toObject: {
            virtuals: true
        },
        toJSON: {
            virtuals: true
        }
    }
);

Project
    .virtual('memberIds')
    .get(function () {
        return this.members.map((member)=>{return member.id})
    });

Project
    .virtual('memberIdsAndApplicantIds')
    .get(function () {
        let idMap = new Set;
        this.members.forEach((member)=> {
            idMap.add(member.id)
        });
        this.applications.forEach((applicant) => {
            idMap.add(applicant.id)
        });

        return Array.from(idMap);
    });

Project
    .virtual('recruitment')
    .get(function () {
        if(this.closure.closed)
            return false;
        let recruitment = false;
        this.roles.forEach((role) => {
            if(role.recruitment) recruitment = true;
        });
        return recruitment;
    });

Project
    .methods
    .hasRoleTitled = function (title) {
        return (0 <= this.roles.map(role => role.title).indexOf(title))
    };



module.exports = Project;