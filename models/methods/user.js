const Path = require('path');
const models = {
        Project: require(Path.join(__dirname,'..','project')),
        Ticket: require(Path.join(__dirname,'..','ticket')),
        Report: require(Path.join(__dirname,'..','report')),
        NewUserInvitations: require(Path.join(__dirname,'..','newUserInvitation'))
    },
    User = require(Path.join(__dirname,'..','schemas','user'));


/**
 *
 * @param options {Object}
 *  @param options.where {Object} parameters of projects
 *  @param options.privacy {Number} filter by privacy settings
 *  @param options.includePrivacy {Boolean}
 *  @param options.includeUserDescription {Boolean}
 * @returns {Promise<Array<Object>>}
 */
User.methods.getProjects = function (options) {
    const user = this;
    if(!options)
        options = {};
    options.where = options.where || function(){ return true };
    return new Promise(function (resolve,reject) {
        const userProjects = user.projects.filter(
            project => options.privacy
                ? project.privacy.indexOf(options.privacy)
                : true).map( project => { return {_id: project.id}} );
        if(userProjects.length === 0)
            return resolve([]);
        models.Project.find({
            $or: userProjects,
            $where: options.where
        }).then(
            projects => {
                if(!projects)
                    projects = [];
                if(options.includePrivacy || options.includeUserDescription)
                    projects.forEach((project) => {
                        const projectId = project._id.toString();
                        for(let i = 0; true; i++)
                            if(userProjects[i].id === projectId) {
                                if(options.includePrivacy)
                                    project.privacy = userProjects[i].privacy;
                                if(options.includeUserDescription)
                                    project.userDescription = userProjects[i].userDescription;
                                break;
                            }
                    });
                resolve(projects);
            }
        ).catch(reject);
    });
};

module.exports = User;