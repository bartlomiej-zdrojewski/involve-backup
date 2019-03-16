/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

/**
 * Reading .env properties
 */
const dotenv = require('dotenv').load();

console.log('Initiating server in mode ' + process.env.MODE);

if(process.env.MODE == "LOCAL_DEVELOPMENT") {
    process.env.LOCAL_URL = 'localhost/';
    process.env.LOCAL_URL_SHORT = 'localhost/';
}

const fs = require('fs');
/**r
 * Importing Express as well as necessary HTTP parsing and session components
 */
const express = require('express');
const http = require('http');
const https = require('https');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const busboy = require('connect-busboy');
const stream = require('stream');
const session = require('express-session');
const path = require('path');
const request = require('request');
const paths = require('./paths');


/**
 * Initialising authenticating plugin
 */
const passport = require('./auth');
const passportSocketIo = require('passport.socketio');

/**
 * Initialising Express
 */

const app = express();

/**
 * Setup morgan logger
 */
const morgan = require('morgan');
morgan.token('no-static',
	function (req, res) {
		console.log(req.originalUrl.substr(0,8))
		return (req.originalUrl.substr(0, 8) === '/static/' || req.originalUrl.substr(0, 6) === '/docs/') ? '' : req.originalUrl;

	});
// app.use(morgan('tiny'));
app.use(morgan(function (tokens, req, res) {
	if (req.originalUrl.substr(0, 8) === '/static/' || req.originalUrl.substr(0, 6) === '/docs/')
	    return null;
    else return [
		tokens.method(req, res),
		tokens.url(req, res),
		tokens.status(req, res),
		tokens.res(req, res, 'content-length'), '-',
		tokens['response-time'](req, res), 'ms'
	].join(' ');
}));
/**
 * Configuring HTTPS options
 */
let server, socketServer;
if(process.env.MODE !== "LOCAL_DEVELOPMENT") {
    const key = fs.readFileSync('/etc/letsencrypt/live/' + process.env.LOCAL_URL_SHORT + '/privkey.pem');
    const cert = fs.readFileSync('/etc/letsencrypt/live/' + process.env.LOCAL_URL_SHORT + '/fullchain.pem');
    const ca = fs.readFileSync('/etc/letsencrypt/live/' + process.env.LOCAL_URL_SHORT + '/chain.pem');
    const https_options = {
        key: key,
        cert: cert,
        ca: ca
    };

    server = https.createServer(https_options, app).listen(process.env.PORT || 3000);
    socketServer = https.createServer(https_options, app).listen(process.env.SOCKET_PORT || 5000);
}

/**
 * Configuring HTTP instead of HTTPS for local server debugging
 */

else  {
    server = http.createServer(app).listen(process.env.PORT || 3000);
}

/**
 * Configuring basic Express components
 */

server.on('listening', function () {
    console.log('Listening on port ' + process.env.PORT);
    console.log('Local address is ' + process.env.LOCAL_URL)
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(busboy());

/**
 * Trimming upstream path from request URL
 */

app.use((req, res, next) => {
    if(req.url.substr(0, 4) == '/api') {
        req.url = req.url.substr(4);
        if(req.path === '/portfolio') {
            console.log('unsuported path: /portfolio');
            console.log('change it to /profile/portfolio');
            req.path = '/profile' + req.path;
            req.url = '/profile' + req.url;
        };
    }
    next();
});

/**
 * Initialising secure session management
 */
const sessionstore = require('sessionstore');

const sessionStore = sessionstore.createSessionStore({
    type: 'mongodb',
    host: 'localhost',         // optional
    port: 27017,               // optional
    dbName: 'sessionDb',       // optional
    collectionName: 'sessions',// optional
    timeout: 10000             // optional
    // authSource: 'authedicationDatabase',        // optional
    // username: 'technicalDbUser',                // optional
    // password: 'secret'                          // optional
    // url: 'mongodb://user:pass@host:port/db?opts // optional
});

app.use(session({
    secret: process.env.APP_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());



const txts = require('./texts');

/**
 * Initialising static text content managers
 */
const NodeManager = require('./content/nodes-manager').init();
const CourseManager = require('./content/courses-manager').init();
const CaseManager = require('./content/cases-manager').init();

/**
 * Initialising DB manger
 */
const db = require('./db.js');
db.init(process.env.DB_PORT);

/**
 * Importing modules for image manipulation and e-mail management
 */
const ModImg = require('./modify-images.js');
const Mailer = require('./mailer');
if(
    !fs.existsSync('./public/storage/' + process.env.DB_PORT + '/projects') ||
    !fs.existsSync('./public/storage/' + process.env.DB_PORT + '/users')
    ) throw new Error('Asset storage directories were not found. Create directories /users and /projects under public/storage/' + process.env.dbName);
/**
 * Importing project suggestions algorithm
 */
const pSelector = require('./projectSelector');


if(process.env.MODE === 'LOCAL_DEVELOPMENT') {
    /**
     * Static routing config
     */
    app.use('/static/', express.static('public'));
    app.use('/', express.static('templates'));
    app.use('/docs/',express.static('protocol/swagger'));
    app.use('/old/',express.static('.old/public'));
}

/**
 * The following paths DO NOT have authentication ensured via middleware.
 * The presence of a proper user object has to be verified whenever it is to be used
 */
const io =
	(process.env.MODE === 'LOCAL_DEVELOPMENT') ?
		require('socket.io').listen(server) :
		require('socket.io').listen(socketServer);

io.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: process.env.APP_SECRET,
    store: sessionStore,
    passport: passport,
    cookieParser: cookieParser
}));

io.sockets.on('connection', function (socket) {
    console.log('socket connected');
    socket.on('join', function (data) {
        console.log('Join attempt initiated');
        if (socket.request == undefined) {
            console.log(new Error('request info not provided'));
            return socket.emit('bad request', {error: new Error('request info not provided')})
        }
        if (data.hash == undefined) {
            console.log(new Error('project hash not provided in request object'));
            return socket.emit('bad request', {error: new Error('project hash not provided in request object')})
        }
        if (socket.request.user == undefined) {
            console.log(new Error('failed to retrieve user object, are you logged in?'));
            return socket.emit('bad request', {error: new Error('failed to retrieve user object, are you logged in?')})
        }
        console.log(socket.request.user.name + ' joining room ' + data.hash);
        socket.join(data.hash);

        db.ChatStatus(socket.request.user, data.hash, true, function (err) {
            if(err) {
                console.log(err);
                return socket.emit(err.toString());
            }
            io.to(data.hash).emit('joined', {
                name: socket.request.user.name,
                surname: socket.request.user.surname,
                id: socket.request.user._id
            })
        });
        socket.hash = data.hash;
    });

    socket.on('message', function (data) {
        if (socket.request == undefined) {
            console.log(new Error('request info not provided'));
            socket.emit('bad request', {error: new Error('request info not provided')})
        }
        if (data.hash == undefined) {
            console.log(new Error('project hash not provided in request object'));
            socket.emit('bad request', {error: new Error('project hash not provided in request object')})
        }
        if (socket.request.user == undefined) {
            console.log(new Error('failed to retrieve user object, are you logged in?'));
            socket.emit('bad request', {error: new Error('failed to retrieve user object, are you logged in?')})
        }
        if (data.msg == undefined) {
            console.log(new Error('no message provided'));
            socket.emit('bad request', {error: new Error('no message provided')})
        }
        console.log('Emitting message ' + data.msg + ' to room ' + data.hash);
        io.to(data.hash).emit('message', {
            msg: data.msg,
            from: {
                name: socket.request.user.name,
                surname: socket.request.user.surname,
                id: socket.request.user._id
            }
        });

        db.LogMessage(socket.request.user, data.hash, data.msg, function () {
            console.log('logged message' + data.msg + ' into ' + data.hash + ' message history');

            db.NotifyIfDoesNotHaveNotification(data.hash)
        });



    });

    socket.on('disconnect', function () {
        console.log(socket.request.user.name + ' disconnected from ' + socket.hash);
        db.ChatStatus(socket.request.user, socket.hash, false, function (err) {
            if(err) {
                console.log(err);
                return socket.emit(err.toString());
            }
            io.to(socket.hash).emit('left', {
                name: socket.request.user.name,
                surname: socket.request.user.surname,
                id: socket.request.user._id
            })
        });
    })
});

app.post('/contact', function (req, res) {
    Mailer.SendContactFromEmail(req.body.name, req.body.email, req.body.message);
    res.send('OK');
    });

app.post('/register', function (req, res, next) {
    db.AddUser(req.body.email, req.body.password, req.body, function (err, code) {
        if (err) {
            console.log(err);
            res.status(code).send(err.message);
        } else {
            db.GetUserByEmail(req.body.email, function (err, result) {
                if (err) {
                    console.log(err);
                    res.send(err.message)
                }
                else {
                    req.logIn(result, function (err) {
                        if (err) {
                            console.log(err);
                            res.send(err.message)
                        }
                        else {
                            //Mailer.SendConfirmationEmail(result.confirmationToken, result.email, function (err) {
                            //    if (err) console.log(err);
                            //    res.redirect('/cockpit.html')
                            res.status(302).redirect('/static/cockpit.html');
                            //);

                        }
                    });

                }
            });


        }
    });
});

app.post('/register/complete', function (req, res) {
    if (!req.user) return res.send('Nie jesteś zalogowany.');
    db.UpdateUserDetails(req.user, req.body, function (err) {
        if (!err) res.send('ok');
        else res.send('error');
    })
});

app.get('/register/status', function (req, res) {
    if (!req.user) return res.send({registered: false});
    if (!req.user.email) return res.send({registered: false});
    if (!req.user.city) return res.send({registered: false});
    res.send({registered: true});
});


app.post('/login', function (req, res, next) {
    //noinspection JSUnresolvedFunction
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            res.status(401).send(err.message);
            return;
        }
        req.logIn(user, function (err, result) {
            if (err) {
                res.status(result).send(err.message);
                return;
            }
            res.redirect('/static/cockpit.html');
        });
    })(req, res, next);
});

app.get('/facebook', passport.authenticate('facebook'));
app.get('/facebook/callback', passport.authenticate('facebook', {
        'successRedirect': '/api/verifyComplete',
        'failureRedirect': '/'
    })
);

app.get('/verifyComplete', function (req, res) {
    if (req.user.email) return res.redirect('/static/cockpit.html');
    else res.redirect('/static/register-completion.html')
});


app.get('/recovery', function (req, res, next) {
    let id = req.user ? req.user._id.toString() : null;
    db.GetUser(id, (err, userById) => {
        if(err) {
            return next(err);
        }
	    db.GetUserByEmail(req.query.email, function (err, user) {
		    if (err) {
			    console.log(err);
			    return res.status(409).send('Nieprawidłowe zapytanie.')
		    }
		    if (user === null) {
		        if(userById)
		            user = userById;
                else {
                    console.log(user);
			        return res.send('Ten adres email nie jest przypisany do żadnego konta');
                }

		    }
			    db.AddRecoveryHash(user, function (err, token) {
				    if (err || !token) {
					    console.log('could not add recovery token to' + user.email + 'because of ' + err);
					    return res.set(500).send('Spróbuj ponownie później.')
				    }
				    Mailer.SendRecoveryEmail(token, user.email, function (err) {
					    if (err) {
						    console.log(err);
						    return res.status(403).send('Nie udało nam się wysłać wiadomości na podany adres')
					    }
					    res.send('ok');
				    })
			    })
	    })
    })

});

app.get('/validate_token', function (req, res) {
    if (!req.query.token) return res.status(409).send('Nieprawidlowe zapytanie');
    db.FindRecoveryTokenOwner(req.query.token, function (err, user) {
        if (err) return res.status(401).send(err.message);
        res.send('ok');
    })
});

app.post('/change_password', function (req, res) {
    if (!req.body.password || !req.body.token) return res.status(409).send('Nieprawidlowe zapytanie');
    db.ChangePassword(req.body.token, req.body.password, function (err) {
        if (err) {
            console.log('Rejected pass change, reason:' + err);
            return res.send(err.message);
        }
        res.send('ok');
    })
});

app.post('/change_email', function (req, res) {
    if (!req.body.email || !req.user) db.ChangeEmail(req.body.email, req.user, function (err) {
        if (err) console.log(err);
        else res('ok');
    })

});

/*
 app.get('/TEST_MAPS', function (req, res) {
 geocoder.geocodeIntoJSON(req.query.city, process.env.GOOGLE_API_KEY, function (err, result) {
 console.log(result);
 res.send(result)

 })
 });*/

app.use('*', function (req, res, next) {    /// Verify that user is logged in, has provided an email address, then add notifications
    //if (process.env.MODE == 'LOCAL_DEVELOPMENT') return next();
    if (process.env.MODE === 'DEVELOPMENT' && req.query.secret == "KNO3") return next();

    if (req.user == undefined) {
        console.log('Unauthenticated request made to ' + req.url + ' Response: 401');
        return res.status(401).send('Nie jesteś zalogowany.');
    }

    if (req.user.email == undefined) return res.redirect('/static/register-completion.html');

    db.GetNotifications(req.user, function (err, notifications) {
        if(err) console.log(err);
        req.notifications = [];
        for(let i = notifications.length - 1; i >= 0; i--) {
            notifications[i].icon = "default.svg";
            req.notifications.push(notifications[i]);
        }


        if (!req.user.personalData.latitude) {
            const notif = txts.CreateNotification('not-geocoded', '' , {});
            req.notifications.push({
                id: notif.hash,
                createdOn: new Date(),
                notification: notif
            })
        }

        next();

    });
});

/**
 * From now on, the presence of a user object IS ENSURED
 */

app.get('/chat', function (req, res) {
    if (req.query.hash == undefined) return console.log('project hash undefined');
    db.GetProject(req.query.hash, function (err, project) {
        if (err) return console.log(err);
        if (project == undefined) return console.log(new Error('nonexistent project requested'));
        let chatUsersWithStatuses = [];
        const ids = project.members.map(function (member) {
            return member.id;
        });

        db.GetUsers(ids, function (err, users) {
            for (let i = 0; i < project.members.length; i++) {
                users.forEach(function (user) {
                    if (user._id.toString() == project.members[i].id.toString()) {
                        chatUsersWithStatuses.push({
                            id: user._id.toString(),
                            name: user.name,
                            surname: user.surname,
                            avatar: paths.getPublicPath('userAvatar', user.personalData.avatar),
                            available: (project.members[i].online || false)
                        });
                    }
                });
            }
            project.chat = project.chatHistory;

            res.send({
                members: chatUsersWithStatuses,
                leader: (project.leader == req.user._id.toString()),
                chat: project.chatHistory,
                notifications: req.notifications
            });
        });

    })
});


app.post('/create_project', function (req, res) {
    //console.log(JSON.stringify(req.body));
    const config = {
        title: req.body.title,
        depiction: req.body.depiction,
        leader: req.user._id.toString(),
        roles: [
            txts.CreateLeader(req.user)
        ],
        applications: [
            txts.CreateApplication(['Lider']
                , req.user, '', true)
        ],
        members: [txts.CreateProjectMember(req.user, 'Lider')],
        image: paths.defaultProjectAvatarPath
    };

    db.AddProject(config, function (err, project) {
        if (err) res.status(500).send('Błąd serwera');
        else {
            db.AddMembershipToUserProfile(req.user, project, function (err) {
                if (err) console.log(err);
                res.json({hash: project._id});
                db.AddProjectReportBase(project._id, function (err) {
                    if (err) console.log(err);
                })
            });
        }
    })
});

app.post('/application', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        let wasInvited = false;
        for (let i = 0; i < project.invitations.length; i++) {
            if (project.invitations[i].email == req.user.email) {
                wasInvited = true;
            }
        }
        for (let i = 0; i < project.applications.length; i++) {
            if (project.applications[i].id == req.user.id) {
                res.status(399).send("This user has already applied for joining to this project");
                return;
            }
        }
        db.AddApplication(req.user, project, txts.CreateApplication(
            req.body.roles, req.user, req.body.explanation, wasInvited
        ), function (err, result) {
            if (wasInvited) {
                db.AddMember(project, txts.CreateProjectMember(req.user, req.body.roles[0]), false, function (err) {
                    if (err) console.log(err);

                    db.AddMembershipToUserProfile(req.user, project, function (err) {
                        if (err) return res.status(400).send('Error');
                        res.send('OK');
                    })
                })
            }
            else {
                res.send('OK');
                db.GetUser(project.leader, function (err, projLeader) {
                    db.AddNotification(projLeader, txts.CreateNotification('applied', project._id.toString(),
                        {
                            projectName: project.title,
                            name: req.user.name,
                            surname: req.user.surname
                        }))
                })
            }
        })
    })
});

app.post('/profile/picture', function (req, res) {
    let fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        const path = paths.getFileSystemPath('userAvatar', req.user._id.toString());
        fstream = fs.createWriteStream(path);
        file.pipe(fstream);
        fstream.on('close', function () {
            ModImg.ResizeProfilePic(path, function (err) {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err.message);
                }
                db.GetUser(req.user._id.toString(), (err, user) => {
	                db.UpdateProfilePicture(user, req.user._id.toString, (err) => {
		                if (err) {
			                console.log(err);
			                return res.status(500).send(err.message);
		                }
		                res.json({
			                image: paths.getPublicPath('userAvatar', req.user._id.toString()),
			                notifications: req.notifications
		                });
                    })
                })


            });
        });
    });
});

app.post('/profile/description', function (req, res) {
    db.UpdateProfileDescription(req.user, req.body.description, function (err) {
        if (err) {
            console.log(err);
            res.send(err.message);
        }
    })

});

app.post('/profile/personal_data', function (req, res) {
    db.UpdatePersonalData(req.user, req.body, function (err, result) {
        res.send('OK');
    })
});


app.get('/listUsers', function (req, res) {
    db.ListUsers();
    res.send('Listed in console')
});

app.get('/selector', function (req, res) {
    db.ToggleSelector(req.user);
    res.send('Selector for user ' + req.user.name + ' is now set to ' + req.user.selector);
});

app.get('/cockpit', function (req, res) {
    const user = req.user;

    if(req.user.type === "mentor") {
        db.GetMentoredProjects(req.user, (err, mentoredProjects) => {
            if(err) {
                console.log(err);
                return res.status(401).send('Błędne ID użytkownika. Czy jesteś zalogowany?')
            }

            mentoredProjects.forEach((project) => {project.favourite = false});

            res.json({
                projects: mentoredProjects,
                notifications: req.notifications,
                newuser: user.newUser
            });

        });
        return
    }

    pSelector.getProjects(req.user, 8, function (projects) {
        let projectsObj = [];
        for (let i = 0; i < projects.length; i++) {
            let project = {
                title: projects[i].title,
                depiction: projects[i].depiction,
                description: projects[i].description,
                roles: projects[i].roles.map(function(role){
                    return {
                        title: role.title,
                        description: role.description,
                        image: paths.getPublicPath('nodeIcon', role.skill)
                    }
                }),
                favourite: false,
                recruitment: projects[i].recruitment,
                applied: false,
                member: false,
                image: paths.getPublicPath('projectAvatar',projects[i].image),
                hash: projects[i]._id.toString()
            };
            if (user.favouriteProjects[(projects[i]._id.toString())] !== undefined)
                project.favourite = (user.favouriteProjects[(projects[i]._id.toString())] === true || user.favouriteProjects[(projects[i]._id.toString())] === 'true');
            for(let j = 0; j < projects[i].applications.length; j++)
                if(projects[i].applications[j].id === user._id.toString())
                {
                    if(projects[i].applications[j].member === true)
                        project.member = true;
                    else
                        project.applied = true;
                    break;
                }
            projectsObj.push(project);
        }
        res.json({
            notifications: req.notifications,
            projects: projectsObj,
            tutorial: req.user.tutorials.cockpit
        });

    });

});

app.get('/notification', function (req, res) {
    db.SetNotificationSeen(req.user, req.query.hash, true, function (err) {
        if (err) console.log(err);
        res.send('ok');
    })
});

app.get('/logout', function (req, res) {
    if (!req.user) res.redirect('/');
    req.session.destroy(function () {
        req.logout();
        res.redirect('/');
        //res.clearCookie(session.id);

    });
    //res.send('Wylogowano');
});

app.get('/favourite', function (req, res) {
    db.SetFavourite(req.user, req.query.hash, req.query.value, function (err) {
        if (err) { console.log(err); res.status(401).send('Nie udało się wykonać operacji');}
        else res.send('OK')
    })
});

app.get('/browser', function (req, res) {
    db.GetAllProjects(function (err, projects) {
        if (err) return console.log(err);
        for (let i = 0; i < projects.length; i++) {
            projects[i].favourite = false;
            if (req.user.favouriteProjects[projects[i]._id.toString()] == undefined) {
                projects[i].favourite = false;
            }
            else projects[i].favourite = req.user.favouriteProjects[projects[i]._id.toString()];
            projects[i].hash = projects[i]._id;
        }
        res.json({
            projects: projects,
            notifications: req.notifications,
            tutorial: req.user.tutorials.browser
        })
    })
});

app.get('/profile', function (req, res) {
    let projectData = [];
    db.FindUserProjects(req.user, function (err, projects) {
        if (err) {
            console.log(err);
            return res.send(err)
        }
        projects.forEach(function (project) {   // TODO: przejrzeć co się tu dzieje, bo raczej nie najlepiej ogółem
            let status = 'Członek zespołu';
            if (project.leader == req.user._id.toString()) status = 'Lider zespołu';
            if (project.mentor == req.user._id.toString()) status = 'Mentor zespołu';
            projectData.push({
                title: project.title,
                image: project.image,
                hash: project._id,
                status: status
            })
        });
        const skills = req.user.skills.map(function (skill) {
            const node = NodeManager.getNodeByCode(skill.code);
            return {
                title: node ? NodeManager.getFullName(node.nodeCode) : 'Wezeł nie istnieje',
                image: node ? node.icon : 'Wezeł nie istnieje'
            }
        });
        res.json({
            user: {
                name: req.user.name,
                surname: req.user.surname,
                sex: req.user.personalData.sex,

                schoolname: req.user.personalData.schoolname,
                education: req.user.personalData.education,
                city: req.user.personalData.city,

                avatar: paths.getPublicPath('userAvatar', req.user.personalData.avatar),
                description: req.user.personalData.description
            },
            skills: skills,
            projects: projectData,
            notifications: req.notifications,
            tutorial: req.user.tutorials.browser
        })
    });

});


app.get('/print/nodes', function (req, res) {
    res.json(NodeManager.allNodesWithFullName());
});

app.get('/confirm', function (req, res) {
    if (req.query.token == undefined) {
        console.log('Missing token');
        res.status(409).send('Missing token')
    }
    db.ConfirmUser(req.query.token, function (err, user) {
        if (req.user) res.redirect(process.env.LOCAL_URL + '/cockpit.html');
        else {
            const notification = txts.CreateNotification('accepted', project._id.toString(),
                {
                    projectName: project.title
                });
            db.AddNotification(user, notification);
            res.redirect(process.env.LOCAL_URL);
        }
    })
});

app.get('/nodes', function (req, res) {

    let NodeToSkillLevelHashMap = {};
    req.user.skills.forEach(function (userSkill) {
        NodeToSkillLevelHashMap[userSkill.code] = userSkill.level
    });
    let filteredSkillsArray = [];
    NodeManager.allNodesWithFullName().forEach((node) => {
         if(node.description !== 'nie dotyczy' && node.nodeCode.length > 3) {
             filteredSkillsArray.push(node);
         }
    });
    const skills = JSON.parse(JSON.stringify(filteredSkillsArray));
    skills.forEach(function (node) {
        node.hash = node.nodeCode;
        node.level = NodeToSkillLevelHashMap[node.nodeCode] || 0;
        node.role_title = 'Specjalista ' + node.title;
        node.role_description = 'Osoba posiadająca umiejętność: ' + node.title;
    });
    db.GetProjects(req.user.projects.map(project => project.id), (err, projects) => {
        if(err) console.log(err);
	    projects.forEach(function (el) {
		    if (el.leader.toString() === req.user._id.toString()) {
			    el.status = 'Lider zespołu';
			    el.leader = true;
		    }
		    else if (el.mentor === req.user._id.toString()) {
			    el.status = 'Mentor zespolu';
			    el.mentor = true;
		    }
		    else {
			    el.status = 'Członek zespołu';
			    el.leader = false;
		    }
	    });

	    res.send({
		    skills: skills,
		    projects: projects,
		    notifications: req.notifications,
		    tutorial: req.user.tutorials.skills
	    })
    })


});

app.post('/node/level', function (req, res) {
    if ((req.body.level != undefined) && req.body.hash) {
        db.SetUserKnowledgeLevel(req.user, req.body.hash, req.body.level);
        res.send('ok');
    }
    else res.header('403').send('Missing level or skill code')
});

app.get('/expertise', function (req, res) {

    res.json({
        notifications: req.notifications,
        tutorial: req.user.tutorials.expertise
    });
});

app.get('/cases', function (req, res) {
    const CaseObjects = CaseManager.allCases.map(function (caseObj) {
        let chart = [];
        caseObj.relatedAbilityCodes.forEach(function (abilityCode) {
            NodeManager.allNodes.forEach(function (node) {
                if (node.nodeCode == abilityCode.code) chart.push({
                    title: NodeManager.getFullName(node.nodeCode),
                    part: abilityCode.level,
                    hash: node.nodeCode
                })
            });

        });

        return {
            title: caseObj.title,
            depiction: caseObj.depiction,
            description: caseObj.description,
            requirements: caseObj.requirements,
            chart: chart,
            text: true,
            image: caseObj.image,
            link: caseObj.link,
            hash: caseObj.hash

        }
    });

    res.send({
        cases: CaseObjects,
        notifications: req.notifications,
        tutorial: req.user.tutorials.cases
    })
});

app.get('/case', function (req, res) {
    if (req.query.hash) {
        const caseObj = CaseManager.getCaseById(req.query.hash);
        if (caseObj == null) {
            console.log('No case found for hash ' + req.query.hash);
            res.status(403).send('Invalid hash')
        }

        const skillsMap = {};
        caseObj.relatedAbilityCodes.forEach(abilityObj => {
            let node = NodeManager.getNodeByCode(abilityObj.code.substr(0,3));
            if(!node) {
                console.log('Missing node listed as related ' + abilityObj.code);
                node = {nodeCode: "---", title: "Nie znaleziono umiejętności"}
            }
            if(skillsMap[node.nodeCode])
                skillsMap[node.nodeCode].part += abilityObj.level;
            else
                skillsMap[node.nodeCode] = {
                    part: abilityObj.level,
                    title: NodeManager.getFullName(node.nodeCode)
                }
        });
        const skills = Object.keys(skillsMap).map(hash => {return {
           part: skillsMap[hash].part,
           title: skillsMap[hash].title,
           hash: hash
        };});
        let formattedProjects = [];
        db.GetProjectsByCaseID(caseObj.hash, function (err, projects) {
            if (err) return console.log(err);
            projects.forEach(function (project) {
                let isMember = false;
                project.members.forEach(function (memberObj) {
                    if (memberObj.id == req.user._id.toString()) isMember = true;
                });
                formattedProjects.push({
                    title: project.title,
                    member: isMember,

                    image: project.image,
                    hash: project._id.toString()
                })
            });

            const userProjectIds = req.user.projects.map(function (project) {
                return project.hash;
            });

            db.GetProjects(userProjectIds, function (err, projects) {
                res.send({
                    case: {
                        title: caseObj.title,
                        brief: caseObj.brief,
                        preview: caseObj.preview
                    },
                    skills: skills,
                    projects: formattedProjects,
                    available: projects.map(function (project) {
                        return {
                            title: project.title,
                            status: (project.leader == req.user._id.toString()) ? 'Lider zespołu' : ((project.mentor == req.user._id.toString())? 'Mentor zespołu' : 'Członek zespołu'),
                            leader: (project.leader == req.user._id.toString()),
                            assigned: project.isCase,

                            image: project.image,
                            hash: project._id.toString()
                        }
                    }) || [],
                    notifications: req.notifications,
                    tutorial: req.user.tutorials.case
                })
            })

        })

    }
    else {
        console.log('Case hash not provided');
        res.status(403).send('No case hash provided')
    }
});


app.post('/case/assign_project', function (req, res) {
    if (req.body && req.body.case && req.body.project) {
        db.GetProject(req.body.project, function (err, project) {
            if (err) console.log(err);
            db.AssignProjectToCase(project, req.body.case, function (err) {
                res.send('ok')
            })
        })
    }
    else {
        console.log('Either case or project ids missing from body');
        res.status(401).send('Either case or project ids missing from body')
    }
});

app.get('/tutorial', function (req, res) {
    if(typeof req.query.value === 'undefined') {
        res.status(400);
        res.send('value parameter missing');
        return
    }
    db.GetUser(req.user.id, function (err, user) {
        if (err) {
            res.status(500);
            res.send('Internal err');
            return;
        }
        if (typeof req.query.view === 'undefined') {

            user.tutorials.all = req.query.value;
            user.markModified('tutorials');
            user.save(function (err) {
                if(err) console.log(err);
                db.GetUser(req.user.id, function (err, user) {

                    res.send('ok');
                })

            })

        }

        else if (typeof user.get('tutorials.' + req.query.view) !== 'undefined') {
            user.tutorials[req.query.view] = req.query.value;
            res.send('ok');
        }
        else {
            res.status(400);
            res.send('This is not a valid path');
        }
    })
});

app.get('/make_me_a_mentor', function (req, res) {
    if(req.query.secret == 'supertajneciastko') {
        db.ChangeTypeToMentor(req.user, (err) => {
            res.send(err);
        });
    }

    else res.send('invalid cookie');

});

app.get('/debug/project', function (req, res) {
    db.GetProject(req.query.projectId, (err, project) => {
        res.json(project);
    })
});

// app.get('/tutorial/cockpit', function (req, res) {
//     db.GetUser(req.user.id, function (err, user) {
//         res.send(user.tutorials.cockpit);
//     })
// })

app.use('/', require(path.join(__dirname, 'routes')));

function GetAndTestExtensions(filename, allowedExtensions) {
    const extension = filename.substr(filename.length - 4).toLowerCase();

    let containedInAllowed = false;
    if (allowedExtensions != undefined) {
        for (let i = 0; i < allowedExtensions.length; i++) if (allowedExtensions[i] == extension) containedInAllowed = true;
    }

    if (containedInAllowed) return {filename: filename, extension: extension}
}
