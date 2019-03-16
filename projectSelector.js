/* Copyright (C) Brian Camacho and Zuzanna Opała - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Brian Camacho <brian.camacho@invity.space> and Zuzanna Opała <zuzanna.opala@invity.space>, July 2017
 */

var db = require('./db.js');

var projectSelector = {

///ktore aspekty sa brane pod uwage:
    useLocation: true,
    randomness: 0.5,

    /**
     *
     * @param user {Object} obiekt zawierajacy dane uzytkownika, w szczegolnosci nodes - tablicę umiejętności uzytkownika (id,degree)
     * @param n {Number} ilosc oczekiwanych projektow
     * @param done {Function}
     */
    getProjects: function (user, n, done) {
        var result = [];
        console.log("projectSelector!");
        db.GetAllProjects(function (err, projects) {
            if (err) {
                console.log("projectSelector: db.GetAllProjects error: " + err);
                let isErr = true;
                return done([]);
            }
            if (projects.length < n)
                n = projects.length;
            if (n == 0) {
                let isErr = true;
                return done([]);
            }
            for (var p in projects)
                if(projects.hasOwnProperty(p)) {
                    projects[p].score = (projectSelector.locationScore(user, projects[p])
                        + projectSelector.basicProjectScore(user.skills, projects[p]))
                        - (Math.random() % projectSelector.randomness);
                    result.push(projects[p]);
                }

            result.sort(function (a, b) {
                return a.score < b.score;
            });
            done(result.slice(0,n));

        });
    },

/// Funkcje pomocnicza:


    locationScore: function (user, project) {
        var score = 0;
        for (var m in project.members) {
            if(project.members.hasOwnProperty(m)) {
                var dist = Infinity;
                db.FindById(project.members[m].id, function (err, member) {
                    if (err) {
                        console.log("projectSelector: findById error: " + err);
                        return;
                    }
                    if(member == null) return;
                    dist = projectSelector.distance(user.personalData.latitude, user.personalData.longitude, member.latitude, member.longitude);

                    if (dist < 7)
                        score += 5;
                    else if (dist < 15)
                        score += 4;
                    else if (dist < 25)
                        score += 2;
                    else if (dist < 50)
                        score += 0.5;
                });
                //console.log("znaleziona odleglosc: "+dist);
            }

        }
        score /= project.members.length;
        return score;
    },

    basicProjectScore: function (userSkills, project) {
		let score = 0,
			sideScore = 0;

		project.roles.forEach(function (role) {
			let roleScore = 0,
				code = role.skill;

			userSkills.forEach(function (userSkill) {
				if (0 < userSkill.level) // TODO: Uwzglednic tez nizsze wezly + glebsze zagniezdzenia
					if (userSkill.code == code)
						roleScore += 10 + 2 * userSkill.level;
					else if (code.length > 6 && userSkill.code.substring(0, 6) == code.substring(0, 6))
						roleScore += 1 + 2 * (userSkill.level - 1);
					else if (userSkill.code.substring(0, 3) == code.substring(0, 3))
						roleScore += 0.5 * userSkill.level;
			});
			roleScore = projectSelector.normalize(roleScore);
			if (role.recruitment)
				score += roleScore;
			else
				sideScore += roleScore;
		});
		
		return score + 0.25 * sideScore;
	},

    normalize: function (x) {
        return x;
    },

    distance: function (lat1, lon1, lat2, lon2) {
        var φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180, λ1 = lon1 * Math.PI / 180, λ2 = lon2 * Math.PI / 180, R = 6371;
        var x = (λ2 - λ1) * Math.cos((φ1 + φ2) / 2);
        var y = (φ2 - φ1);
        //console.log(x + " " + y);
        return Math.sqrt(x * x + y * y) * R;
    }

};

module.exports = projectSelector;
