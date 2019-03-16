const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const AllViews = [{
    path: 'cockpit', enabled: true
}, {
    path: 'profile', enabled: true
}, {
    path: 'skills', enabled: true
}, {
    path: 'project', enabled: true
}, {
    path: 'recruitment', enabled: true
}, {
    path: 'browser', enabled: true
}, {
    path: 'chat', enabled: true
}, {
    path: 'cases', enabled: true
}, {
    path: 'case', enabled: true
}, {
    path: 'expertise', enabled: true
}];

let tutorials = new mongoose.Schema({
    views: {
        type: [{
            path: String, enabled: Boolean
        }],
        default: AllViews
     }
},  {
    toObject: {
        virtuals: true,
        methods: true
    },
    toJSON: {
        virtuals: true,
        methods: true
    }
});


AllViews.forEach((view) => {
    tutorials.virtual(view.path)
        .set(function (val) {
            this.views.forEach(function (tutorial) {
                if(tutorial.path === view.path) tutorial.enabled = val;
            });
        })
        .get(function () {
            return (this.views.filter((tutorial) => {
                return (tutorial.path === view.path)
            }))[0].enabled
        });

});

tutorials.virtual('all')
    .set(function (val) {
        this.views.forEach((tutorial, idx) => {
            this.views[idx].enabled = val;
        });
    });

let User = new mongoose.Schema({
    type: {type: String, default: 'user'}, //['user'|'mentor']
    email: {type: String, default: ''},
    name: {type: String, default: ''},
    surname: {type: String, default: ''},
    confirmedEmail: {type: Boolean, default: false},
    confirmationToken: {type: String, default: ''},
    authHash: {type: String, default: ''},
    salt: {type: String, default: ''},
    facebookToken: {type: String, default: ''},
    googleToken: {type: String, default: ''},

    personalData: {
        city: {type: String, default: ''},
        longitude: {type: Number, default: -1 },
        latitude: {type: Number, default: -1 },
        schoolname: {type: String, default: ''},
        education: {type: String, default: ''},
        sex: {type: String, default: ''},
        birthDate: {type: Date},
        profilePicPath: {type: String, default: ''},
        avatar: {type: String, default: 'default'},
        description: {type: String, default: ''},
        phoneNumber: {type: String, default: ''},
        privacy: { Number: [String], default: { 1: [], 2: []}}
    },
    projects: {type: [{
        id: String,
        privacy: [Number],
        description: {type: String}
    }], default: []},
    favouriteProjects: {type: Object, default: {}},
    skills: [{
        code: String,
        level: Number,
        description: {type: String, default: ''},
        privacy: { type: [Number], default: []},    // settings of privacy; table of enabled groups
        confirmed: {
            confirmationDate: Date,
            projectId: String,
            roleName: String,
            explanation: String, // from mentor
            mentorId: String
        }
    }],
    notifications: [{
        id: String,
        createdOn: Date,
        fromProject: String,
        notification: {
            title: String,
            description: String,

            icon: String,
            Type: String,

            seen: Boolean,
            link: String,
            hash: String,
            date: Date
        }
    }],
    recoveryHash: String,
    recoveryExpires: Date,
    selector: {type: Boolean, default: false},
    facebookImageURI: {type: String, default: ''},
    tutorials: {type:tutorials, default: AllViews},
    attachments: { type: [{
        title: {type: String},
        link: {type: String, required: true},
        category: {type: String},
        date: {type: Date, required: true, default: new Date(Date.now())},
        privacy: [Number]
    }], default: []}
},
    {
        toObject: {
            virtuals: true,
            methods: true
        },
        toJSON: {
            virtuals: true,
            methods: true
        }
    });

// AllViews.forEach((view) => {
//     User.virtual('tutorials.' + view.path)
//         .set(function (val) {
//             this.tutorials.forEach(function (tutorial) {
//                 if(tutorial.path === view.path) tutorial.enabled = val;
//             });
//         })
//         .get(function () {
//             return (this.tutorials.filter((tutorial) => {
//                 return (tutorial.path === view.path)
//             }))[0].enabled
//         });
//
// });


module.exports = User;