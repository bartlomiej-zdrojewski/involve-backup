const express = require('express'),
	path = require('path');

const db = require(path.join(__dirname, '..', 'db.js')),
	nodeManager = require(path.join(__dirname, '..', 'content', 'nodes-manager')).init();

const router = express.Router();

router.get('/:id/public-profile', function (req, res) {
	function prepareResponse(user, mine) {
		let projectsData = [];

		db.FindUserProjects(user, function (err, projects) {
			if (err)
				return res.send(err);

			projects.forEach(function (project) {
				let status;

				switch (user._id) {
					case project.leader:
						status = 'Lider zespołu';
						break;
					case project.mentor:
						status = 'Mentor zespołu';
						break;
					default:
						status = 'Członek zespołu';
				}

				projectsData.push({
					title: project.title,
					image: project.image,
					hash: project._id,
					status: status
				});
			});

			const skills = user.skills.map(function (skill) {
				const node = nodeManager.getNodeByCode(skill.code);

				return {
					title: node ? node.title : 'Wezeł nie istnieje',
					image: node ? node.icon : 'Wezeł nie istnieje'
				}
			});

			res.json({
				mine: mine,
				user: {
					name: user.name,
					surname: user.surname,
					sex: user.personalData.sex,
					schoolname: user.personalData.schoolname,
					education: user.personalData.education,
					city: user.personalData.city,
					avatar: '/static/images/users/' + user.personalData.avatar,
					description: user.personalData.description
				},
				skills: skills,
				projects: projectsData,
				notifications: req.notifications
			});
		});
	}

	if ('me' === req.params.id)
		prepareResponse(req.user, true);
	else
		db.GetUser(req.params.id, function (err, user) {
			if (err) {
				res.status(409).send(err.message);
				return console.log(err);
			}

			prepareResponse(user, false);
		});
});

module.exports = router;
