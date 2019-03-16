const express = require('express'),
    path = require('path'),
    db = require(path.join(__dirname,'../..','db')),
    Mailer = require(path.join(__dirname,'../..','./mailer')),
    paths = require(path.join(__dirname,'../..','paths')),
    txts = require(path.join(__dirname,'../..','texts'));

const router = express.Router();


router.post('/report', function (req, res) {
    db.SubmitUserTicket(req.body.id, req.body.explanation, function (err, result) {
        if (err) {
            console.log(err);
            res.send(err.message);
        }
        res.send('OK')
    })
});

router.post('/delete', function (req, res) {
    db.GetProject(req.body.project, function (err, project) {
        if(err)
            return res.status(401).send(err.message);
        db.RemoveTeamMember(req.body.id, req.body.explanation, project, function (err) {
            if(err)
                res.status(401).send(err.message);
            else
                res.send('OK');
        })

    })
});

router.post('/invite', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    if (!req.body.project || !req.body.contact) {
        console.log('project: ' + req.body.project + ' contact: ' + req.body.contact);
        console.log('POST missing project id or contact email');
        res.set(400).send('Missing project id or contact email (were they in fields titled project and contact?)');
        return;
    }

    db.GetUserByEmail(req.body.contact, function (err, user) {
        db.GetProject(req.body.project, function (err, project) {
            if (project == null) return console.log(err);
            project.invitations.push({date: new Date(), email: req.body.contact});
            project.markModified('invitations');
            project.save();
            if (user == null) {
                db.InviteToPlatformAndProject(req.body.contact, project, function (err) {
                    if (err) console.log(err);
                    else {
                        Mailer.SendProjectInvitation(project._id.toString(), req.body.contact, req.user, () => {})
                    }
                })
            }

            else {
                db.AddNotification(user, txts.CreateNotification('invited',
                    project._id.toString(),
                    {projectName: project.title}
                ))
            }
        })

    })
});


router.get('/', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        if (err) {
            console.log(err);
            return res.send(err.message);
        }

        let responseObject = {};

        responseObject.recruitment = project.recruitment;
        responseObject.leader = (req.user._id.toString() == project.leader);
        responseObject.mentor = (req.user._id.toString() == project.mentor);

        db.GetUsers(project.members.map((member)=>{return member.id}), function (err, memberDbObjects) {
            let projectMembers = [];
            memberDbObjects.forEach((user)=> {
                let userRoles;
                for(let i = 0; i < project.applications.length; i++)
                    if(project.applications[i].id == user._id.toString()) {
                        userRoles = project.applications[i].roles;
                        break;
                    }
                if(userRoles == undefined) {
                    console.log("To nie ma sensu. Użytkownik wyszukany z bazy na podstawie listy nie  widnieje na liście :/");
                    res.send("Unexpected error");
                }
                let memberObject = {
                    name: user.name,
                    id: user._id.toString(),
                    surname: user.surname,
                    description: (user.personalData.description || ''),
                    avatar: paths.getPublicPath('userAvatar', user.personalData.avatar),
                    roles: []
                };

                if(user._id.toString() == project.leader)
                    memberObject.roles.push({
                        title: 'Lider zespołu',
                        description: 'Rozdziela zadania w projekcie',
                        image: 'default.png',
                        appreciated: true
                    });

                userRoles.forEach(function (role) {
                    if (role.accepted) {
                        let fullRole = db.FindRole(role.role, project);
                        let isConfirmed = false;
                        for(let i = 0; i < user.skills.length; i++)
                            if(user.skills[i].code == fullRole.skill)
                            {
                                if(user.skills[i].level == 3)
                                    isConfirmed = true;
                                break;
                            }
                        memberObject.roles.push({
                            title: fullRole.title,
                            description: fullRole.description,
                            image: paths.getPublicPath('nodeIcon', fullRole.skill),
                            appreciated: isConfirmed
                        })
                    }
                });
                projectMembers.push(memberObject);

            });
            responseObject.members = projectMembers;

            let EmailToDateMap = {};
            const invitedUserEmails = project.invitations.map(function (invitation) {
                EmailToDateMap[invitation.email] = invitation.date;
                return invitation.email;
            });
            db.GetUsersByEmail(invitedUserEmails, function (err, users) {
                if (users != null) {
                    responseObject.invitations = users.map(function (user) {
                        return {
                            name: user.name,
                            surname: user.surname,
                            contact: user.email,
                            image: paths.getPublicPath('userAvatar', user.personalData.avatar()),
                            date: EmailToDateMap[user.email].getFullYear()
                            + '-' + (EmailToDateMap[user.email].getMonth() + 1)
                            + '-' + EmailToDateMap[user.email].getDate()
                        }
                    });
                }
                else responseObject.invitations = [];

                responseObject.notifications = req.notifications;
                responseObject.tutorial = req.user.tutorials.team;
                res.json(responseObject);
            });
        });

    });
});

router.post('/appreciate', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url); //lol co XD
    if(req.body === undefined)
    {
        console.log("empty body sent to /team/appreciate");
        res.send("empty body sent to /team/appreciate");
    }
    db.ConfirmSkill(req.user, req.body, function(err) {
        if(err)
            res.send("confirmation failed");})
});


module.exports = router;