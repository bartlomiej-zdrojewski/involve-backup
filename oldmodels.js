/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

var mongoose = require('mongoose');
const dotenv = require('dotenv').load();

const applicationSchema = new mongoose.Schema({

})

schemas = {

    


    Ticket: new mongoose.Schema({ //this is for complaints
        type: {type: String, default: 'Project'}, //type can be project or user ATM
        id: {type: String, default: ''},
        explanation: {type: String, default: ''}
    }),

    Report: new mongoose.Schema({ //this is for updating on your progress with a mentor
        projectId: {type: String, default: ''},
        reports: [],
        responses: {type: Array, default: [{date: 0, text: ''}]},
        mentors: {type: Array, default: []},
        sent: {type: Boolean, default: false}
    }),

    NewUserInvitation: new mongoose.Schema({
        invitedTo: {type: String, required: true},
        projectName: {type: String},
        email: {type: String, required: true},
        expires: {type: Date}
    })
};



// schemas.User
//     .virtual('tutorials.view')
//     .get(function (view) {
//         let val = null;
//         this.tutorials.forEach(function (tutorial) {
//             if(tutorial.view === view) val = tutorial.enabled;
//         });
//         if(val === null) throw new Error('No such view');
//         return val;
//     });
let models = {};
for (let schemaName in schemas) {
    if(schemas.hasOwnProperty(schemaName)) {
        models[schemaName] = mongoose.model(schemaName, schemas[schemaName])
    }
}

module.exports = models;

