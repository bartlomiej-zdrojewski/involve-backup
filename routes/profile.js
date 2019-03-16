const express = require('express'),
    path = require('path'),
    db = require(path.join(__dirname,'..','db')),
    paths = require(path.join(__dirname,'..','paths')),
    models = require(path.join(__dirname,'..','models')),
    Cases = require(path.join(__dirname,'..','content','cases-manager')),
    Skills = require(path.join(__dirname,'..','content','nodes-manager')).init();

const router = express.Router();

router.get('/portfolio', (req,res,next) => {
    models.User.findById(req.user.id).then(
        user => {
            res.data.skills = user.skills.map( skill => {
                return {
                    title: Skills.getFullName(skill.code),
                    level: skill.level,
                    description: skill.description,
                    hahs: skill.code
                }
            });
            res.data.attachments = user.attachments.map(
                attachment => {
                    return {
                        title: attachment.title,
                        link: attachment.link,
                        category: attachment.category,
                        date: attachment.date
                    };
                });
            user.getProjects().then(
                projects => {
                    if(!projects)
                        projects = [];
                    res.data.projects = [];
                    res.data.cases = [];
                    projects.forEach(
                        project => {
                            res.data.projects.push({
                                title: project.title,
                                depiction: project.depiction,
                                leader: req.user.id === project.leader,
                                finished: project.closure?project.closure.closed:false,
                                success: project.closure?project.closure.projectSuccessful:false,
                                hash: project._id.toString(),
                                image: paths.getPublicPath('projectAvatar',project._id) //TODO: dodać nowy moduł paths
                            });
                            if(project.isCase){
                                const projectCase = Cases.getCaseById(project.caseId)
                                res.data.cases.push({
                                    title: projectCase.title,
                                    depiction: projectCase.depiction,
                                    leader: project.leader === req.user.id,
                                    finished: project.closure?project.closure.closed:false,
                                    success: project.closure?project.closure.projectSuccessful:false,
                                    projectHash: project._id.toString(),
                                    caseHash: project.caseId,
                                    image: paths.getPublicPath('projectAvatar', project._id) //TODO: dodać nowy moduł paths
                                })
                            }
                        }
                    );
                    res.json(res.data);
                }
            ).catch(err => res.send('error - get projects: ' + err));
        }
    ).catch(
        err => res.send('error - find user: ' + err)
    );
});

router.get('/', (req,res,next) => {
    models.User.findById(req.user.id).then(
        user => {
            res.data.tutorials = false; // TODO
            res.data.details = {
                sex: user.personalData.sex,
                education: user.personalData.education,
                city: user.personalData.city,
                birthdate: user.personalData.birthDate,
                school: user.personalData.schoolname,
                avatar: paths.getPublicPath('userAvatar',user.personalData.avatar),
                name: user.name,
                surname: user.surname
            };
            res.data.portfolio = {};
            res.data.cv = {};   //todo
            res.data.portfolio.skills = user.skills.map( skill => {
                return {
                    title: Skills.getFullName(skill.code),
                    level: skill.level,
                    hash: skill.code
                }
            });
            res.data.portfolio.attachments = user.attachments.map(
                attachment => {
                    return {
                        title: attachment.title,
                        link: attachment.link,
                        category: attachment.category,
                        date: attachment.date
                    };
                });
            user.getProjects().then(
                projects => {
                    if(!projects)
                        projects = [];
                    res.data.portfolio.projects = [];
                    projects.forEach(
                        project => {
                            res.data.portfolio.projects.push({
                                title: project.title,
                                depiction: project.depiction,
                                leader: req.user.id === project.leader,
                                finished: project.closure?project.closure.closed:false,
                                success: project.closure?project.closure.projectSuccessful:false,
                                hash: project._id.toString()
                            });
                        }
                    );
                    res.json(res.data);
                }
            ).catch(err => console.log('error - get projects: ' + err));
        }
    ).catch(
        err => console.log('error - find user: ' + err)
    );
});

router.post('/remove', (req, res, next)=> {
    db.RemoveUser(req.user._id.toString(), (err) => {
        if(err) return next(err);

        req.session.destroy();
        res.redirect('/static/')
    })
});

module.exports = router;