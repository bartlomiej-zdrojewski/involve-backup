const express = require('express'),
    path = require('path'),
    db = require(path.join(__dirname,'../..','db')),
    paths = require(path.join(__dirname,'../..','paths')),
    txts = require(path.join(__dirname,'../..','texts'));

const NodeManager = require(path.join(__dirname,'../..','content','nodes-manager')).init();

const router = express.Router();

router.post('/create_role', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        const newRole = {
            title: req.body.title,
            description: req.body.description,
            recruitment: true,
            skill: req.body.skill,
            image: req.body.skill + '.svg',
            members: []
        };
        db.AddRole(newRole, project, function (err) {
            if (err) {
                console.log(err);
                return res.status(409).send(err.message);
            }
            else res.send('OK');
        })
    })
});

router.post('/edit_role', function (req, res) {
    let responded = false;
	db.GetProject(req.query.hash, function (err, project) {
		project.roles.forEach(roleObj => {
		    if(roleObj.title === req.body.oldTitle)
		        if(!project.hasRoleTitled(req.body.newTitle) || req.body.newTitle === req.body.oldTitle) {
			        responded = true;
	                roleObj.title = req.body.newTitle ? req.body.newTitle : roleObj.title;
	                roleObj.description = req.body.description ? req.body.description : roleObj.description;

	                project.applications.forEach((app) => {
	                    let idx = app.roles.map((role)=>role.role).indexOf(req.body.oldTitle);
	                    if(idx > -1) {
	                        app.roles[idx].role = req.body.newTitle
                        }
                    });

	                project.markModified('roles');
			        project.markModified('applications');

			        return project.save(function (err) {
		                if (err) {
			                console.log(err);
			                res.status(409).send(err.message);
		                }
		                else res.send('OK');
	                });
                }
                else {
		        res.status(400).send('W projekcie istnieje już rola o nazwie ' + req.body.newTitle);
		        responded = true;
		        }
        });
		if(!responded) res.status(400).send('Nie ma w tym projekcie roli o nazwie ' + req.body.oldTitle);
	})
});

router.post('/delete_role', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    db.GetProject(req.query.hash, function (err, project) {
        db.RemoveRole(req.body.role, project, function (err) {
            if (err) {
                res.status(409).send(err.message);
                return console.log(err);
            }
            res.send('OK');
        })
    })
});

router.post('/involve_member', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    db.GetProject(req.query.hash, function (err, project) {
        if (err) {
            res.status(409).send(err.message);
            return console.log(err);
        }
        db.GetUser(req.body.id, function (err, user) {
            if (err) {
                res.status(409).send(err.message);
                return console.log(err);
            }
            db.AddRoleMember(project, user, req.body.role, function (err) {
                if (err) {
                    res.status(409).send(err.message);
                    return console.log(err);
                }
                res.send('ok');
            })
        })
    })
});

router.post('/dismiss_role', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);

    db.GetProject(req.query.hash, function (err, project) {
        if (err) {
            res.status(409).send(err.message);
            return console.log(err);
        }
        db.RemoveRoleApplication(project, req.body.id, req.body.role, function (err) {
            if (err) {
                res.status(409).send(err.message);
                return console.log(err);
            }
            res.send('ok');
        })

    })
});

router.post('/accept_role', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    db.GetProject(req.query.hash, function (err, project) {
        if (err) {
            res.status(409).send(err.message);
            return console.log(err);
        }
        db.GetUser(req.body.id, function (err, user) {
            if (err) {
                res.status(409).send(err.message);
                return console.log(err)
            }
            //console.log('verifying if user is member')
            if (!db.IsMember(user, project)) {
                //if (!req.body.response) return res.status(409).send(user.name + ' no response provided');
                //console.log(user.name + ' is not a member of ' + project.title + ' yet')
                db.AddMember(project, txts.CreateProjectMember(user, req.body.role), req.body.response, function () {
                    db.AddMembershipToUserProfile(user, project, function (err) {
                        if (err) console.log(err);
                        db.AcceptRoleApplicationAddMemberToRole(project, user, req.body.role, function (err) {
                            if (err) {
                                res.status(409).send(err.message);
                            }
                            const notification = txts.CreateNotification('accepted', project._id.toString(),
                                {
                                    projectName: project.title
                                });
                            db.AddNotification(user, notification);
                            res.send('ok')
                        })
                    });
                });

            } else {
                // console.log(user.name + ' is a member of ' + project.title);
                db.AcceptRoleApplicationAddMemberToRole(project, user, req.body.role, function (err) {
                    if (err) {
                        res.status(409).send(err.message);
                    }
                    else res.send('ok')
                })
            }
        })

    })
});

router.post('/dismiss_application', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    db.GetProject(req.query.hash, function (err, project) {
        if (err) {
            res.status(409).send(err.message);
            return console.log(err);
        }
        db.GetUser(req.body.id, function (err, user) {
            if (err) {
                res.status(409).send(err.message);
                return console.log(err)
            }
            db.RemoveUserApplication(project, user, req.body.response, function (err) {
                if (err) {
                    res.status(409).send(err.message);
                    return console.log(err)
                }
                const notification = txts.CreateNotification('rejected', project._id.toString(),
                    {projectName: project.title}
                );
                db.AddNotification(user, notification);
                res.send('ok');
            })
        })
    })
});

router.post('/exempt_role', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    db.GetProject(req.query.hash, function (err, project) {
        if (err) {
            res.status(409).send(err.message);
            return console.log(err);
        }
        db.GetUser(req.body.id, function (err, user) {
            if (err) {
                res.status(409).send(err.message);
                return console.log(err)
            }
            db.ExemptRoleFromUser(project, user, req.body.role, function (err) {
                if (err) {
                    console.log(err);
                    res.status(409).send(err.message)
                }
                else res.send('ok');
            })
        })
    })
});


router.get('/', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        if (err) return console.log(err);
        if (project == undefined) return console.log("no project found for hash " + req.query.hash);
        let resObj = {};

        resObj.roles = project.roles.map(function (projRole) {
            const icon = NodeManager.getNodeByCode(projRole.skill).icon || 'default.svg';
            return {
                title: projRole.title,
                description: projRole.description,
                icon: icon,
                recruitment: projRole.recruitment,
                recommended: 0, //TODO: Add support for recommended views,
                skill: projRole.skill
            }
        });
        db.GetUsers(project.memberIdsAndApplicantIds, (err, members) => {
            err ? console.log(err) : null;
            resObj.applications = project.applications.map(function (projApp) {
                let roles = [], accepted = [];
                projApp.roles.forEach(function (appRole) {
                    roles.push(appRole.role);
                    accepted.push(appRole.accepted);
                });

                let user = {};
                let member = false;
                for(let i=0; i<members.length; i++)
                    if(members[i]._id.toString() == projApp.id) {
                        user = members[i];
                        member = (project.members.indexOf(user._id.toString()) == -1);
                        break
                    }

                return {
                    id: projApp.id,
                    name: user.name,
                    surname: user.surname,
                    avatar: paths.getPublicPath('userAvatar', user.personalData.avatar),
                    description: projApp.description,
                    explanation: projApp.explanation,
                    roles: roles,
                    accepted: accepted,
                    member: member
                }
            });
            resObj.skills = [];
            NodeManager.allNodes.forEach(function (node) {
                if(node.nodeCode.description != 'nie dotyczy' || node.nodeCode.length == 3)
                    resObj.skills.push({
                        title: NodeManager.getFullName(node.nodeCode),
                        icon: node.icon,
                        hash: node.nodeCode,
                        role_title: 'Specjalista ' + node.title,
                        role_description:'Osoba posiadająca umiejętność: ' + node.title
                    })
            });
            resObj.tutorial = req.user.tutorials.recruitment;
            resObj.notifications = req.notifications;
            res.send(resObj);
        })



    })
});

router.get('/change', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        if (err) return console.log(err);
        db.ChangeRecruitment(req.query.role, project, req.query.value, function (err) {
            if (err) console.log(err);
            else res.send('OK');
        })
    })
});

module.exports = router;