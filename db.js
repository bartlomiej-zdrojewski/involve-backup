/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

/**
 * Created by nopony on 26.04.16.
 */


const dotenv = require('dotenv').load();
const mongoose = require('mongoose');
const dbPort = process.env.DB_PORT;
const crypto = require('crypto');
const m = require('./models');
let db = {};
const geocoder = require('./google-api-geocoder');
const fs = require('fs');
const txts = require('./texts');

const paths = require('./paths');
const request = require('request');

mongoose.Promise = require('bluebird');

db.init = function init(optionalDbPort) {
    if(optionalDbPort === undefined) optionalDbPort = 27017;

    console.log('Connecting to mongodb@ ' + 'mongodb://localhost/' + optionalDbPort);
    mongoose.connect('mongodb://localhost/' + optionalDbPort, function(err) {
        if(!err) console.log('MongoDB connection established');
        else console.log('[CRITICAL] MONGODB FAILED WITH ERROR: ' + err)
    });

};

function Encrypt (password) {
    const sul = crypto.randomBytes(16).toString('hex');
    const passHash = crypto.createHash('sha256');
    passHash.update(password + sul);
    return {
        passHash: passHash.digest('hex'),
        salt: sul
    }
}

// db.GetAllNodes = function(done) {
//     m.Node.find({}, function (err, result) {
//         if(err) console.log(err);
//         done(err, result);
//     })
// };

// db.GetAllLeaves = function (done) {
//     m.Node.find({leaf: true}, 'title tree icon _id', function (err, nodes) {
//         done(err, nodes);
//     })
// };

db.AuthEmail = function AuthEmail (password, email, done) {
    m.User.findOne({email: email}, function (err, result) {
        if(err) done(err);
        if(!result) done(new Error('No such user'));
        if(result[0].hash == crypto.createHash('sha256').update(password + result[0].salt)) done(null, 'Success');
        else done(null, 'Failure');
    })
};

db.AddUser = function (email, password, personal, done) {
    if(!email) {
        done(new Error('Brak adresu email'), 400);
        return;
    }
    if(!password) {
        done(new Error('Brak hasla'), 400);
        return;
    }
    db.GetUserByEmail(email, function (err, result) {
        if(err) {
            done(new Error('Internal server error'), 500);
            return;
        }
        if(result) {
            done(new Error('Adres email juz istnieje w bazie'), 409);
        }
        else {
            const hashObj = Encrypt(password);
            if(process.env.GOOGLE_API_KEY == undefined) console.log('[CRITICAL] failed to load google api key, geocoding will not work');
            geocoder.geocodeIntoJSON(personal.city, process.env.NOMINATIM_KEY, function (err, lat, lng) {

                if(err) console.log(err);

                lat = lat ? lat : 52.0977181;
                lng = lng ? lng : 19.0258159;

                const personalData = {
                    sex: personal.sex,
                    schoolname: personal.schoolname,
                    education: personal.education,
                    city: personal.city,
                    latitude: lat,
                    longitude: lng,
                    birthDate: personal.birthDate
                };
                let newUser = new m.User({
                    email: email,
                    authHash: hashObj.passHash,
                    salt: hashObj.salt,
                    name: personal.name,
                    surname: personal.surname,
                    personalData: personalData,
                    newUser: true,
                    confirmationToken: crypto.createHash('sha256').update(email).digest('hex'),
                    projects: []
                });

                newUser.save(function (err, user) {
                    if (err) {
                        console.log(err);
                        done(err);
                    } else {
                        console.log('Created user ' + email);
                        console.log('Looking up pending invitations');
                        m.NewUserInvitation.find({email: email}, function (err, invitations) {
                            invitations.forEach(function (invitation) {
                                db.AddNotification(user, txts.CreateNotification('invited',invitation.invitedTo,
                                    {projectName: invitation.projectName}));
                                console.log('Invited ' + user.name + ' to ' + invitation.projectName);
                            })
                        });
                        m.NewUserInvitation.remove({email: email});
                        done(null, 'Success');
                    }
                });
            })

        }
    });
    
};
db.AddUserByFacebookProfile = function (profile, done) {
    if(profile.name.givenName == undefined) {
        const nameArr = profile.displayName.split(' ');
        profile.name.givenName = nameArr[0];
        profile.name.familyName = nameArr[nameArr.length - 1];
    }
    let newUser = new m.User({
        name: profile.name.givenName,
        surname: profile.name.familyName,
        email: profile.email,
        facebookToken: profile.id
    });
    newUser.save(function (err) {
        if(err) {
            console.log(err);
            done(err);
            return
        }
        m.User.findOne({facebookToken: profile.id}, function (err, user) {
            if(err) {
                done(err);
                return
            }
            request('https://graph.facebook.com/v2.8/' + profile.id + '/picture?type=large')
                .pipe(fs.createWriteStream(paths.getFileSystemPath('userAvatar', user._id.toString()))
                    .on('close', () => {
                        console.log('done downloading');
                        user.facebookImageURI = 'https://graph.facebook.com/v2.8/' + profile + '/picture?type=large';
                        user.personalData.avatar = paths.getPublicPath('userAvatar', user._id.toString());
                        user.markModified('facebookImageURI');
                        user.markModified('personalData');
                        user.save();
                        done(err, user)
                    }));
/*            request({
                    uri: 'https://graph.facebook.com/v2.8/' + profile + '/picture?type=large'
                },
                function (error, response, body) {
                    if(error) return console.log(error);
                    fs.writeFile(paths.getFileSystemPath('userAvatar', user._id.toString()), body, (err) => {
                        if(err) console.log(err);
                        user.facebookImageURI = response.request.uri.pathname;
                        user.personalData.avatar = paths.getPublicPath('userAvatar', user._id.toString());
                        user.markModified('facebookImageURI');
                        user.markModified('personalData');
                        user.save();
                    });
                });
            done(err, user);*/
        });
    })
};
db.ChangeEmail = function (email, user, done) {
    user.email = email;
    user.markModified('email');
    user.save(function (err) {
        done(err)
    })
};
db.ChangePassword = function (password, user, done) {
    let hashObj = Encrypt(password);
    user.authHash = hashObj.passHash;
    user.salt = hashObj.salt;
    user.save((err) => {
        done(err ? err : null)
    })
};
/**
 *
 * @param user
 * @param detailsObject {Object}
 * @param detailsObject.email
 * @param detailsObject.sex
 * @param detailsObject.birthdate
 * @param detailsObject.schoolname
 * @param detailsObject.education
 * @param detailsObject.city
 * @param done Function
 */
db.UpdateUserDetails = function (user, detailsObject, done) {

    if(detailsObject.email) user.email = detailsObject.email;
    if(detailsObject.sex) user.personalData.sex = detailsObject.sex;
    if(detailsObject.birthdate) user.personalData.birthDate = detailsObject.birthdate;
    if(detailsObject.schoolname) user.personalData.schoolname = detailsObject.schoolname;
    if(detailsObject.education) user.personalData.education = detailsObject.education;
    if(detailsObject.city) {
        user.personalData.city = detailsObject.city;
        geocoder.geocodeIntoJSON(detailsObject.city, process.env.GOOGLE_API_KEY, function (err, lat, lng) {
                            user.personalData.latitude = lat;
                            user.personalData.longitude = lng;
                            user.save(function (err) {
                                done(null);
                            });
            
        })
    }
    else user.save(function (err) {
        done(null);
    });


};
db.ListUsers = function() {
    m.User.find({}, function(err, data) {

        if(err) console.log(err);
        if(data!=undefined) data.forEach(function(el) {
            console.log(el)
        })

    })
};


// db.GetUsers = function(emails, done) {
//     let expArray = [];
//     emails.forEach(function (email) {
//         expArray.push( {email: email} )
//     });
//     if(expArray.length == 0) {
//         done(null, []);
//         return;
//     }
//     m.User.find({$or: expArray}, function (err, users) {
//         if(err) done(err);
//         done(null, users);
//     })
// };
db.FindById = function(_id, done) {
    m.User.findById(_id, function(err, result) {
        done(err, result);
    })
};
db.FindByFacebookId = function (fbid, done) {
    m.User.findOne({facebookToken: fbid}, function (err, result) {
        if(err) {
            done(err);
            return;
        }
        done(null, result)
    })
};

db.GetProject = function(projectId, done) {
    m.Project.findOne({_id:projectId}, function (err, result) {
        if(err) return done(err);
        done(null, result);
    })
};
db.GetProjects = function (projectIds, done) {
    m.Project.find({_id: {$in: projectIds} }, (err, projects) => {
        if(err) return done(err);
        if(projects === null) return done(null, []);
        done(null, projects);
    })
};

db.GetProjectsByCaseID = function (caseID, done) {
    m.Project.find({caseId: caseID}, function (err, res) {
        if(err) return done(err);
        done(null, res)
    })
}

db.AddProject = function (config, done) {
    let newProject = new m.Project(config);
    newProject.save(function (err, project) {
        if(err) {
            done(err);
            return
        }
        done(null, project);
    })
};

db.SetFavourite = function (user, projectId, value, done) {
    user.favouriteProjects[projectId] = (value == true || value == 'true');
    user.markModified('favouriteProjects');
    user.save(function (err) {
        done(err);
    })
};

db.NoLongerNew = function (user) {
    user.newUser = false;
    user.save();
};

db.GetUserInProjectStatus = function (user, project, done) {
    let resultFlags = {
        leader: false,
        member: false,
        mentor: false,
        favourite: false,
        invited: false,
        applied: false
    };

    project.members.forEach(function (member) {
        if(member.id == user._id.toString()) resultFlags.member = true;
    });
    
    if(project.leader == user._id.toString()) resultFlags.leader = true;

    if(project.mentor == user._id.toString()) {
        resultFlags.mentor = true;
        resultFlags.member = true;
    }

    if(user.favouriteProjects[project._id.toString()] == true) resultFlags.favourite = true;

    
    project.invitations.forEach(function (invitation) {
        if(invitation.email == user.email) resultFlags.invited = true;
    });
    
    project.applications.forEach(function (application) {
        if(application.id == user._id.toString()) resultFlags.applied = true;
    });
    
    done(null, resultFlags);
};

db.CheckForMessages = function (user, project, done) {
    for(let i = 0; i < project.responses.length; i++) {
        if(project.responses[i]._id == user._id) {
            return done(null, project.responses[i])
        }
    }
    return done(null, null);
};

db.AddApplication = function (user, project, application, done) {
    
    project.applications.push(application);
    project.markModified('applications');
    project.save(function (err, result) {
        if(err) console.log(err);
        if(!err) done(null, 'Application added')
    });
};

db.AddMember = function (project, member, userResponse, done) {
    project.members.push(member);
    if(!userResponse) userResponse = {title: '', text: ''};
    project.responses.push({
        for: member.id,
        title: userResponse.title,
        text: userResponse.text
    });

    project.markModified('responses');
    project.markModified('members');
    project.save(function (err) {
        if(err) console.log(err);
        done(err);
    })
};

db.SubmitProjectTicket = function (projectId, explanation, done) {
    let newTicket = new m.Ticket({
        explanation: explanation,
        id: projectId
    });
    newTicket.save(function (err) {
        if(err) console.log(err);
        done(null, null)
    })
};
db.SubmitUserTicket = function (userId, explanation, done) {
    let newTicket = new m.Ticket({
        explanation: explanation,
        id: userId
    });
    newTicket.save(function (err) {
        if(err) console.log(err);
        done(err, null)
    })
};
db.UpdateProjectDescription  = function(project, description, done) {
    project.description = description;
    project.markModified('description');
    project.save(function (err) {
        if(err) console.log(err);
        done(err)
    })
};

db.UpdateMedia = function (project, media, done) {
    console.log(media)
    project.media = media;
    project.markModified('media');
    project.save(function (err) {
        if(err) done(err);
        done(null)
    })
};

db.RemoveTeamMember = function (userId, explanation, project, done) {
    if(userId == project.leader)
        return done({message: "Leader cannot be removed. First change leader of the project than remove this user"});
    for(let i = 0; i < project.members.length; i++) {
        if(project.members[i].id == userId) {
            project.members.splice(i, 1);
            project.markModified('members');
            for(let j = 0; j < project.applications.length; j++)
                if(project.applications[j].id == userId)
                {
                    // project.applications[i].member = false;
                    for(let k = 0; k < project.applications[j].roles.length; k++)
                        project.applications[j].roles[k].accepted = false;
                    project.responses.push({
                        for: userId,
                        title: 'Zostałeś wyproszony z projektu',
                        text: explanation
                    });
                    project.markModified('applications');
                    project.markModified('responses');
                    return project.save((err)=>{
                        if(err)
                            return done(err);
                        db.GetUser(userId, (err,user)=>{
                            if(err)
                                return done(err);
                            db.AddNotification(user,txts.CreateNotification('kicked',project._id.toString(),{ projectName: project.title}));
                            for(let i = 0; i < user.projects.length; i++)
                                if(user.projects[i].id === project._id.toString())
                                {
                                    user.projects.splice(i, 1);
                                    break;
                                }
                            user.markModified('projects');
                            user.save(function(err){
                                if(err)
                                    return done(err);
                                done(null);
                            });
                        });
                    })
                }
            return done({message: "no such user in project applications"});
        }
    }
    done({message: "no such user in project members"});

};

db.GetAllProjects = function (done) {
    m.Project.find({}, function (err, result) {
        done(err, result);
    })
};

db.UpdatePersonalData = function (user, newData, done) {
    user.personalData.schoolname = newData.schoolname;
    user.personalData.education = newData.education;
    user.personalData.city = newData.city;
    user.personalData.sex = newData.sex;
    user.markModified('personalData');
    user.save(function (err) {
        done(err, null)
    })
};

db.UpdateProfilePicture = function (user, path, done) {
    user.personalData.avatar = path;
    user.markModified('personalData');
    user.save();
    done(null);
};

db.AddMembershipToUserProfile = function (user, project, done) {
    user.projects.push({
        id: project._id.toString(),
        privacy: []
    });
    user.markModified('projects');
    user.save(function (err) {
        done(err)
    })
};

db.GetMembers = function (project, done) {
    let expArray = [];
    project.members.forEach(function (member) {
        expArray.push( {_id: member.id} )
    });
    //console.log('ExpArray: ' + JSON.stringify(expArray));
    if(expArray.length == 0) {
        done(null, []);
        return;
    }
    if(expArray.length == 1) {
        m.User.find(expArray[0], function (err, users) {
            if(err) done(err);
            done(null, users);
        });
        return;
    }
    m.User.find({$or: expArray}, function (err, users) {
        if(err) done(err);
        done(null, users);

    })
};
db.UpdateMembership = function (user, project, done) {
    for(let i=0; i<user.projects.length; i++) {
        if(user.projects[i].id == project._id) {
            user.projects[i].title = project.title;
            user.projects[i].image = project.image;
        }
    }
    user.markModified('projects');
    user.save(function (err) {
        done(err)
    })
};

db.SetProfileImagePath = function (projectId, path, done) {
    db.GetProject(projectId, function (err, project) {
        project.image = path;
        project.markModified('image');
        project.save(function (err) {
            done(err)
        })
    })
};

db.UpdateProfileDescription = function (user, description, done) {
    user.personalData.description = description;
    user.markModified('personalData');
    user.save(function (err) {
        if(err) return done(err);
        done(null)
    })
};

db.GetUsers = function (userIds, done) {
    let expArray = [];
    userIds.forEach(function (id) {
        expArray.push( {_id: id} )
    });
    if(expArray.length === 0) {
        done(null, []);
        return;
    }
    if(expArray.length === 1) {
        m.User.find({_id: userIds[0]}, function (err, users) {
            if(err) done(err);
            done(null, users);
        });
        return;
    }
    m.User.find({$or: expArray}, function (err, users) {
        if(err) done(err);
        done(null, users);
    })
};
db.GetUsersByEmail = function (emails, done) {
    let expArray = [];
    emails.forEach(function (email) {
        expArray.push( {email: email} )
    });
    if(expArray.length == 0) {
        done(null, null);
        return;
    }
    if(expArray.length == 1) {
        m.User.find({email: emails[0]}, function (err, users) {
            if(err) done(err);
            done(null, users);
        });
        return;
    }
    m.User.find({$or: expArray}, function (err, users) {
        if(err) done(err);
        done(null, users);
    })
};


db.AddProjectReportBase = function (projectId, done) {
    let newReport = new m.Report({
        projectId: projectId
    });
    newReport.save();
};

db.MarkReportsAsSent = function (projectId, done) {
    m.Report.findOne({projectId: projectId}, function (err, report) {
        report.sent = true;
        report.markModified('sent');
        report.save();
        //  actually send out the emails, and tick sent back to false
        done(err, report);
    })
};

db.UpdateReports = function (projectId, reports, done) {
    m.Report.findOne({projectId: projectId}, function (err, report) {
        report.reports = reports;
        report.markModified('reports');
        report.save();
        done(err, null);
    })
};

db.GetReports = function (projectId, done) {
    m.Report.findOne({projectId: projectId}, function (err, report) {
        if(err) return done(err);
        if(report === undefined) return done(new Error('Project with id' + projectId + ' not found'));
        if(report === null) return done(null, {reports: [], responses: []});
        done(null, {reports: report.reports, responses: report.responses})
    })
};

db.FindUserProjects = function (user, done) { // TODO: co to? po co to? czy to jest w ogóle potrzebne?
    let ids = [];
    user.projects.forEach(function (project) {
        ids.push({_id: project});
    });
    if(ids.length == 0)
        done(undefined, ids);
    else
        m.Project.find({$or: ids}, function (err, projects) {
            done(err, projects)
        })
};

db.ChatStatus = function (user, projectId, status, done) {
    db.GetProject(projectId, function (err, project) {
        if(err) return done(err);
        if(!project) return done(new Error('ProjectId ' + projectId + ' matched no projects in DB'), null);
        for(let i = 0; i < project.members.length; i++)
            if(project.members[i].id == user._id.toString()) {
                project.members[i].online = status;
                project.markModified('members');
                project.save();
                return done(null);
            }
        return done("user not found in members");
    });
};

db.LogMessage = function (user, projectId, message, done) {
    db.GetProject(projectId, function (err, project) {
        if(err) return done(err, null);
        if(project.lastChatMessageFrom == user._id.toString()) {
            project.chatHistory[project.chatHistory.length - 1].messages.push(message);
            project.markModified('chatHistory');
            project.save();
            done(null, null);
            return
        }
        project.lastChatMessageFrom = user._id.toString();
        project.chatHistory.push(CreateChatLog(user, message));
        project.markModified('lastChatMessageFrom');
        project.markModified('chatHistory');
        project.save();
        done(null, null);
    })
};

db.GetUser = function (userId, done) {
    m.User.findOne({_id: userId}, function (err, user) {
        done(err, user);
    })
};

db.RemoveUser = function (userId, done) {//TODO: UNTESTED
    db.GetUser(userId, (err, user) => {
        if(user.type === 'mentor') done(new Error('Mentor users cannot be removed yet')); //TODO: add support for removing mentors
        if(err) return done(err);
            db.GetProjects(user.projects.map(project => project.id), (err, projects) => {

                let ApplicationRemovalPromises = projects.map((project) => new Promise((resolve, reject) => {
                        if(project.leader === userId)
                            db.ConfirmProjectClosure(project._id.toString(), false, "Lider projektu usunął swoje konto", userId, (err) =>{
                                if(err) reject(err);
                                else resolve();
                        })
                        else
                            db.RemoveUserApplication(project, user, '', (err) => {
                                if(err) return reject(err);
                                resolve();
                            })
                }));
                Promise.all(ApplicationRemovalPromises)
                    .then(() => {
                        m.User.remove({_id: user._id}, (err) => {
                            done(err ? err : null);
                        })
                })
            })
    })
};

db.ChangeRecruitment = function (roleTitle, project, state, done) {

    project.roles.forEach(function (role) {
        if(role.title == roleTitle) {
            role.recruitment = (state == 'true');
            project.markModified('roles');
            project.save(function (err) {
                if(err) return done(err);
            });
        }
    })
};

db.AddRole = function (roleConfig, project, done) {
    let stop = false;
    project.roles.forEach(function (role) {
        if(role.title == roleConfig.title) {
            done(new Error('Istnieje juz rola o nazwie: ' + roleConfig.title + '. Nazwy rol musza byc unikalne.'));
            stop = true;
        }
    });
    if(stop) return;
    project.roles.push(roleConfig);
    project.markModified('roles');
    project.save(function (err) {
        project.recruitment = true;
        project.markModified('recruitment');
        project.save(function () {
            done(err)
        })

    });
};

db.UpdateRole = function (newTitle, oldTitle, newDescription, done) {
	roleObj.title = req.body.newTitle ? req.body.newTitle : roleObj.title;
	roleObj.description = req.body.description ? req.body.description : roleObj.description;
}

db.RemoveRole = function (roleTitle, project, done) {
    let roleFound = false;
    for(let i =0; i<project.roles.length; i++) {
        if(project.roles[i].title == roleTitle) {
            roleFound = true;
            console.log('removing role ' + project.roles[i].title);
            project.roles.splice(i, 1);
            project.markModified('roles');
            project.save(function (err) {
                done(err);
            });
           // return;
        }
    }
    
   if(!roleFound) done(new Error('Rola ' + roleTitle + ' nie istnieje w tym projekcie'))
};
db.AddRoleMember = function (project, user, roleTitle, done) {

    project.applications.forEach(function (application) {
        if(application.id == user._id.toString()) {
            application.roles.push({role: roleTitle, accepted: false});
        }
    });

    project.markModified('applications');
    project.save(function (err) {
        done(err, null);
    })
};

db.RemoveRoleApplication = function (project, userId, roleTitle, done) {
    for(let i = 0; i < project.applications.length; i++) {
        if(project.applications[i].id == userId) {
            for(let j = 0; j < project.applications[i].roles.length; j++) {
                if(project.applications[i].roles[j].role == roleTitle) {
                    project.applications[i].roles.splice(j, 1);
                    project.markModified('applications');
                    return project.save(function (err) {
                        done(err);
                    });
                }
            }
            return done({message:"Role in user application not found"});
        }
    }
    done({message:"User application object not found"});
};
/**
    Przepraszam za nazwe tej funkcji
 ustawia accepted w aplikacji uzytkownika na true;
 w tablicy members dodaje uzytkownikowi role
 w tablicy roles dodaje uzytkownika do roli
 */
db.AcceptRoleApplicationAddMemberToRole = function (project, user, roleTitle, done) {
    project.applications.forEach(function (application) {
        if(application.id == user._id.toString()) {
            for(let i=0; i<application.roles.length; i++) {
                if(application.roles[i].role == roleTitle)
                    application.roles[i].accepted = true;
            }
        }
    });
    project.roles.forEach(function (role) {
        if(role.title == roleTitle) {
            role.members.push(user._id.toString())
        }
    });
    project.markModified('applications');
    project.markModified('roles');
    project.save(function (err) {
        done(err)
    })
};

db.RemoveUserApplication = function (project, user, userResponse, done) {
    for(let i=0; i<project.applications.length; i++) {
        if(project.applications[i].id == user._id.toString()) {
            project.applications.splice(i, 1)
        }
    }
    for(let i=0; i<project.members.length; i++) {
        if(project.members[i].id == user._id.toString()) {
            project.members.splice(i, 1)
        }
    }
    project.responses.push({
        for: user._id.toString(),
        title: userResponse.title,
        text: userResponse.text
    });
    project.markModified('responses');
    project.markModified('applications');
    project.markModified('members');
    project.save(function (err) {
        done(err)
    })
};

db.MarkRoleAsAcceptedAddResponse = function (project, user, roleTitle, userResponse, done) {

	let memberRoles;
    for(let i=0; i<project.applications.length; i++) {
        if(project.applications[i].id == user._id.toString()) {

            memberRoles = project.applications[i].roles.map(function (role) {
                return role.role;
            });
            project.applications[i].roles.forEach(function (role) {
                if(role.role == roleTitle) role.accepted = true;
            })

        }
    }


    project.markModified('applications');
    project.save(function (err) {
        done(err)
    })
};
db.ExemptRoleFromUser = function (project, user, roleTitle, done) {
    project.applications.forEach(function (app) {
        if(app.id == user._id.toString()) {
            app.roles.forEach(function (role) {
                if(role.role == roleTitle) {
                    role.accepted = false;
                }
            })
        }
    });

    project.roles.forEach(function (role) {
        role.members.forEach(function (roleMemberId, index) {
            if(roleMemberId == user._id.toString()) {
                role.members.splice(index, 1)
            }
        })
    });

    project.markModified('applications');
    project.markModified('roles');
    project.save(function (err) {
        done(err);
    })
};
db.GetNotifications = function (user, done) {
    if(user == undefined) return done('No user object to get notifications from');
    if(user.notifications == undefined) return done(null, []);
    const LatestNotifications =
        user.notifications.length > 100 ? 
            user.notifications.slice(user.notifications.length - 100, user.notifications.length) :
            user.notifications;
    const CastNotifications = LatestNotifications.map(function (notifObj) {
        notifObj.notification.date = notifObj.date;
        return notifObj.notification;
    });
    done(null, CastNotifications);
};
db.AddNotification = function(user, notification) {
    const date = new Date();
    notification.date = date;
    console.log('Creating new notification: ');
    console.log(notification);
    user.notifications.push({id: notification.hash, createdOn: date, notification: notification});
    user.markModified('notifications');
    user.save();

};

db.SetNotificationSeen = function (user, notifId, value, done) {
    user.notifications.forEach(function (notif) {
        if(notif.id.toString() == notifId) {
            notif.notification.seen = value;
        }
    });
    user.markModified('notifications');
    user.save(function (err) {
        done(err);
    })
};

function CreateChatLog(user, message) {
    const d = new Date();
    return {
        date: d,
        name: user.name,
        surname: user.surname,
        id: user._id,
        messages: [message]
    }
}

db.GetUserByEmail = function (email, done) {
    m.User.findOne({email: email}, function (err, user) {
        done(err, user);
    })
};
db.AddRecoveryHash = function (user, done) {
    user.recoveryHash = user._id.toString().substr(0, 8) + crypto.randomBytes(16).toString('hex');
    const d = new Date();
    d.setHours(d.getHours() + 2);
    user.recoveryExpires = d;
    user.markModified('recoveryHash');
    user.markModified('recoveryExpires');
    user.save(function (err) {
        done(err, user.recoveryHash)
    })
};

db.FindRecoveryTokenOwner = function (token, done) {
    m.User.findOne({recoveryHash: token}, 'email _id authHash salt recoveryExpires', function (err, user) {
        if(err) return done(err);
        if(user == null) return done(new Error('Nieprawidlowy klucz odzyskiwania, czy skopiowałeś poprawnie link?'));
        if(user.recoveryExpires < new Date()) return done(Error('Klucz odzyskiwania zostal wygenerowany ponad dwie godziny temu,' +
            ' ze względów bezpieczeństwa musisz wygenerować nowy.'));
        done(null, user);
    })
};

db.ChangePassword = function (token, password, done) {
    db.FindRecoveryTokenOwner(token, function (err, user) {
        if(err) return done(err);
        user.authHash = crypto.createHash('sha256').update(password + user.salt).digest('hex');
        user.markModified('authHash');
        user.save(function (err) {
            done(err);
        })
        
    })
};

db.ConfirmUser = function (token, done) {
    m.User.findOne({confirmationToken: token}, function(err, user) {
        user.confirmedEmail = true;
        user.markModified('confirmedEmail');
        user.save(function (err) {
            done(err, user);
        })
    })
};

// db.TmpAddNodeSkills = function () {
//     m.User.find({}, function (err, allusers) {
//         allusers.forEach(function (user) {
//             if(user.name == 'Zuzanna') {
//                 user.skills = [
//                     {id: "57ef17bfd62f3be3047f3d04",
//                         level: 2},
//                     {id: "57ef17bfd62f3be3047f3cfc",
//                         level: 1},
//                     {id: "57ef17bfd62f3be3047f3cfe",
//                         level: 1},
//                     {id: "57ef17bfd62f3be3047f3d07",
//                         level: 3}
//                 ];
//
//                 user.markModified('skills');
//                 user.save();
//             }
//         })
//     })
// };

db.InviteToPlatformAndProject = function (email, project, done) {
    let newInvitation = new m.NewUserInvitation({
        invitedTo: project._id.toString(),
        email: email,
        projectName: project.title
    });
    newInvitation.save(function (err) {
        done(err);
    })
    
};

db.IsMember = function (user, project) {
    let isMember = false;
    project.members.forEach(function (member) {
        if(member.id == user._id.toString()) {
            isMember = true;
        }
    });
    return isMember;
};

db.FindRole = function (roleTitle, project) {
	let rightRole;
    project.roles.forEach(function (role) {
        if(role.title == roleTitle) rightRole = role;
    });
    if(rightRole) return rightRole;
    console.log('no role titled ' + roleTitle);
    return {
        image: '',
        icon: ''
    }
};

/**
 * 
 * @param user  - the user object to change and save
 * @param code  - code of the skill the level of which is to be changed
 * @param level - the new desired level
 */
db.SetUserKnowledgeLevel = function (user, code, level) {
	let wasFound = false;
    user.skills.forEach(function (skill) {
        if(skill.code==code) {
            wasFound = true;
            skill.level = level
        }
    });
    if(wasFound) user.save();
    else {
        user.skills.push({
            code:code,
            level: level
        });
        user.save()
    }
};

/**
 * @param byteLength: Desired length of the ID in bytes
 * @returns {string} Random id of desired length
 * */

db.GenId = function (byteLength) {
    return crypto.randomBytes(byteLength).toString('hex');
};

db.ToggleSelector = function (user) {
    user.selector = !(user.selector);
    user.save();
};

db.AssignProjectToCase = function (project, caseId, done) {
    project.isCase = true;
    project.caseId = caseId;
    project.save(function (err) {
        done(null)
    })
};

db.RequestProjectClosure = function (projectId, reason, done) {
    db.GetProject(projectId, (err, project) => {
        if(err) return done(err);
        if(project == null) return done(new Error('No such project'));
        project.closure.requested = true;
        project.closure.requestedReason = reason;

        db.GetUser(project.mentor, (err, user) => {
            if(err) return console.log(err);
                db.AddNotification(user, txts.CreateNotification('closure-requested', project._id.toString(), {}))
                project.markModified('closure');
                project.save();
            }
        );
    })
};

db.ConfirmProjectClosure = function (projectId, success, summary, userId, done) {
    db.GetProject(projectId, (err, project) => {
        if(err) return done(err);
        if(!project) return done(new Error('There is no such project'));
        if(project.mentor != userId) return done(new Error('Nie jesteś mentorem projektu'));

        project.closure.projectSuccessful = success;
        project.closure.closed = true;
        project.closure.closedOn = new Date();
        project.closure.successReason = summary;

        const finished = success == true ? 'ukończony' : 'nieukończony';
        const notification = txts.CreateNotification('project-closed', projectId, {projectName: project.title, success: finished})

        db.GetUsers(project.members.map((member) => {return member.id}), (err, users) => {
            if(err) return done(err);
            users.forEach((user) => {
                db.AddNotification(user, notification);
            });

            project.markModified('closure');
            project.save();


        });
    })

}

db.ChangeTypeToMentor = function (user, done) {
    user.type = 'mentor';
    user.markModified('type');
    user.save((err)=>{done(err)});
};

db.SetUserAsMentorOfProject = function (user, projectId, done) {
    if(!user) return done(new Error('No user object provided to set as mentor of project ' + projectId));
    if(!projectId) return done(new Error('No projectId provided to set as project for mentor' + user.name));

    db.GetProject(projectId, (err, project) => {
        if(err) return done(new Error('Invalid projectId provided( ' + projectId + ' ) to set as project for mentor' + user.name));
        project.mentor = user._id.toString();
        project.markModified('mentor');
        project.save(function (err) {
            if(err)
                done(err);
            else
                done();
        });
    })
};

db.GetMentoredProjects = function (user, done) {
    if(user.type != 'mentor') return done(new Error('Ten użytkownik nie jest mentorem'));

    m.Project.find({mentor: user._id.toString()}, (err, mentoredProjects) => {
        if(err) done(new Error('Błąd w obiekcie użytownika'));

        done(null, mentoredProjects);

    })
};

db.ConfirmSkill = function (mentor, userInfo, done) {
    db.FindById(userInfo.id,function(err,user){
        if(err)
            return done(err);
        db.GetProject(userInfo.project, function (err, project) {
            if(err)
                return done(err);
            let currentDate = new Date();
            let skill;
            for(let i = 0; i < project.roles.length; i++)
                if(project.roles[i].title == userInfo.role) {
                    skill = project.roles[i].skill;
                    break;
                }
            if(skill == undefined)
                return done("role doesn't exist in the project");
            if(userInfo.explanation == undefined)
                userInfo.explanation = "Umiejętność " + skill.name + " została wykorzystana w pracy nad projektem \"" + project.title + "\", w którym użytkownik dowiódł biegłej znajomości przedmiotu i wykazał się, wykożystując swoją specjalistyczną wiedzę w praktyce.";
            for(let i = 0; i < user.skills.length; i++)
                if(user.skills[i].code == skill) {
                    user.skills[i].level = 3;
                    user.skills[i].confirmed = {
                        confirmationDate: currentDate,
                        projectId: userInfo.project,
                        roleName: projectInfo.role,
                        explanation: userInfo.explanation,
                        mentorId: mentor
                    };
                    user.markModified('skills');
                    return user.save(function (err) {
                        done(err)
                    });
                }
            user.skills.push({
                code: skill,
                level: 3,
                confirmed: {
                    confirmationDate: currentDate,
                    projectId: userInfo.project,
                    roleName: userInfo.role,
                    explanation: userInfo.explanation,
                    mentorId: mentor
                }
            });
            user.markModified('skills');
            user.save(function (err) {
                done(err)
            });
        });
    })
};

db.NotifyIfDoesNotHaveNotification = function (projectId) {
    db.GetProject(projectId, function (err, project) {
	    let membersIdsToNotify = [];
        project.members.forEach(member => {
            if(!member.online && !member.wasNotified) {
                membersIdsToNotify.push(member.id);
                member.wasNotified = true;
            }
        });


        db.GetUsers(membersIdsToNotify, (err, users) => {
            if(users)
                users.forEach( user => {
                    db.AddNotification(user,
                        txts.CreateNotification(
                            'message',
                            projectId,
                            {
                                projectId: projectId,
                                projectName: project.title
                            })
                    )
                })
        });

    })
};

module.exports = db;
