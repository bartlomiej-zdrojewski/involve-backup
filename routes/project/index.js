const express = require('express'),
    path = require('path'),
    db = require(path.join(__dirname,'..','..','db')),
    fs = require('fs'),
    paths = require(path.join(__dirname,'..', '..','paths')),
    ModImg = require(path.join(__dirname,'..','..','modify-images'));

const NodeManager = require(path.join(__dirname,'../..','content','nodes-manager')).init();

const router = express.Router();

router.use('/team', require(path.join(__dirname, 'team')));
router.use('/recruitment', require(path.join(__dirname, 'recruitment')));
router.use('/reports', require(path.join(__dirname, 'reports')));

router.post('/media', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        console.log(req.body.media);
        db.UpdateMedia(project, req.body.media, function (err) {
            if (err) console.log(err);
            res.send('OK');
        })
    })
});

router.post('/picture', function (req, res, next) {
    let fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        const path = paths.getFileSystemPath('projectAvatar', req.query.hash);
        const publicPath = paths.getPublicPath('projectAvatar', req.query.hash);
        //Path where image will be uploaded1
        fstream = fs.createWriteStream(path);
        file.pipe(fstream);
        fstream.on('close', function () {
            db.SetProfileImagePath(req.query.hash, req.query.hash, function (err) {
                if (err) {
                    console.log(err);
                    return res.send(err.message);
                }
                ModImg.ResizeProfilePic(path, function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err.message);
                    }
                    res.json({
                        image: publicPath
                    });
                });
                // db.GetProject(req.query.hash, function (err, project) {
                //     db.GetMembers(project, function (err, members) {
                //         console.log(members);
                //         members.forEach(function (member) {
                //             db.UpdateMembership(member, project, function (err) {
                //                 if(err) {
                //                     console.log(err);
                //                     return res.send(err.message);
                //                 }
                //
                //             })
                //         });
                //         res.json({
                //             image: req.query.hash + extension
                //         });
                //     })
                // });
            });
        });
    });
});

router.post('/close', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    if(!(
            ((typeof req.body.agreement) == 'boolean') &&
            ((typeof req.body.agreement) == 'boolean') &&
            ((typeof req.body.summary) == 'string') &&
            req.query.hash
        )) {
        res.status(401).send('Nieprawidłowe zapytanie')
    }

    db.ConfirmProjectClosure(req.query.hash, req.body.success, req.body.summary, req.user._id.toString(), (err) => {
        if(err) {
            res.status(401).send(err.message);
            console.log(err);
        }
        res.send('ok');
    })


});

router.post('/report', function (req, res) {
    db.SubmitProjectTicket(req.query.hash, req.body.explanation, function (err, result) {
        res.send('OK')
    })
});

router.post('/closure_request', function (req, res) {
    console.log('remove this console log if no error occurs! ' + req.url);
    if(!req.query.hash || !req.body.explanation) res.status(401).send('Request hash or explanation missing');
    db.RequestProjectClosure(req.query.hash, req.body.explanation, (err) => {
        if(err) {
            res.status(401).send(err.message);
            console.log(err);
        }
        res.send('ok');
    })
});

router.post('/description', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        db.UpdateProjectDescription(project, req.body.description, function (err) {
            if (err) res.status(400).send(err.message);
            res.send('OK')
        })
    })
});

router.get('/assign_mentor', function (req, res) {
    db.GetProject(req.query.hash, function(err, project) {
        if(err || !project)
            return res.status(500).send(err||"No such project");
        if(project.mentor == '')
        {
            db.SetUserAsMentorOfProject(req.user,req.query.hash, (err) => {
                if(err) res.status(500).send(err.message);
                else res.status(200).send('Mentor assigned succesfully');
            });
        }
        else
            res.status(403).send('This project already has a mentor');
    })
});


router.get('/', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        if (err) return res.send(err);
        if (project == null) return res.status(400).send('nie ma takiego projektu');
        for(let i = 0; i < project.roles.length; i++)
            project.roles[i].skill = NodeManager.getFullName(project.roles[i].skill);
        db.GetUserInProjectStatus(req.user, project, function (err, outObj) {
            db.CheckForMessages(req.user, project, function (err, message) {
                outObj.response = message;
                if (message == null) outObj.response = {title: '', text: ''};
                // project.chatHistory = null;
                // project.applications = null;
                // project.responses = null;
                outObj.project = {
                    title: project.title,
                    depiction: project.depiction,
                    description: project.description,
                    image: paths.getPublicPath('projectAvatar', project.image),
                    roles: [],
                    media: project.media
                };

                db.GetUsers(project.memberIds, (err, users) => {
                    err ? console.log(err) : null;
                    project.roles.forEach((role) => {
                        let outRole = {};

                        outRole.title = role.title;
                        outRole.description = role.description;
                        outRole.recruitment = role.recruitment;

                        outRole.skill = NodeManager.getNodeByCode(role.skill);
                        outRole.members = [];
                        users.forEach((user) => {
                            if(role.members.indexOf(user._id.toString()) != -1) outRole.members.push({
                                name: user.name,
                                avatar: paths.getPublicPath('userAvatar', user.personalData.avatar)
                            })
                        });
                        if(outRole.members[0] == undefined) outRole.members.push({name:'',avatar:''});
                        outRole.image = '/images/nodes/default.svg'; //TODO: change this to point to an actual icon
                        outObj.project.roles.push(outRole)
                    })

                    outObj.recruitment = project.recruitment;
                    outObj.notifications = req.notifications;
                    outObj.closure = {
                        state: project.closure.requested || false,
                        explanation: project.closure.requestedReason || '',
                        closed: project.closure.closed
                    };
                    outObj.tutorial = req.user.tutorials.project;
                    res.json(outObj);
                });




                //console.log('Responding with project data ' + outProject);
            })
        })
    })
});


module.exports = router;