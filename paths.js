/**
 * Created by nopony on 26.03.17.
 */
const dotenv = require('dotenv').load();
const params = {
    FSStoragePath: './public/storage/' + process.env.DB_PORT,
    userImagesSuffix: '/users',
    projectImagesSuffix: '/projects',
    publicAssetsPath: '/static/storage/' + process.env.DB_PORT
};



    /**
     * @param {string} type 'userAvatar' or 'projectAvatar'
     * @param {String} filename project/user filename
     */

module.exports.getFileSystemPath = function (type, filename) {
        if(!type || !filename) return console.log('Missing type or filename in fs path call');

        switch (type) {
            case 'userAvatar':
                return params.FSStoragePath + params.userImagesSuffix + '/' + filename + '.jpg';
            break;

            case 'projectAvatar':
                return params.FSStoragePath + params.projectImagesSuffix + '/' + filename + '.jpg';
            break;

            default :
                return console.log('Invalid type in fs path call')
        }
    }

module.exports.getPublicPath = function (type, filename) {
        if(!type || !filename) return console.log('Missing type or filename in fs path call');

        switch (type) {
            case 'userAvatar':
                return params.publicAssetsPath + params.userImagesSuffix + '/' + filename + '.jpg';
                break;

            case 'projectAvatar':
                return params.publicAssetsPath + params.projectImagesSuffix + '/' + filename + '.jpg';
                break;

            case 'nodeIcon':
                return '/images/nodes' + '/' + filename + '.svg';
                break;

            default :
                return console.log('Invalid type in fs path call')
        }
    }

    // defaultUserAvatarPath: '/static/images/users/default.png',
    // defaultProjectAvatarPath: '/static/images/projects/default.png',

    /*
    updateUserImagePaths : function (done) {
        const mg = require('mongoose');
        const m = require('./models');
        const fs = require('fs');
        mg.connect('mongodb://127.0.0.1/' + process.env.dbPath, (err) => {
            if (err) console.log(err);
            else console.log('Connected');
            m.User.find({}, (err, users) => {
                if(err) console.log(err);
                let doneCounter = users.length;
                users.forEach((user) => {
                    let path;
                    if(fs.existsSync(user.personalData.avatar)) {
                        path = paths.getPublicPath('userAvatar', user._id.toString())
                    }
                    else path = paths.defaultUserAvatarPath;
                    user.personalData.avatar = path;
                    user.markModified('personalData');
                    user.save((err) => {
                        if(doneCounter==0) done();
                        doneCounter--;
                        err ? console.log(err) : null;
                    })
                })
            })
        })},*/

// updateProjectImagePaths = function (done) {
//             const mg = require('mongoose');
//             const m = require('./models');
//             const fs = require('fs');
//             mg.connect('mongodb://localhost/' + process.env.dbPath, (err) => {
//                 if (err) console.log(err);
//                 else console.log('Connected');
//                 m.Project.find({}, (err, projects) => {
//                     let doneCounter = projects.length;
//                     projects.forEach((user) => {
//                         let path;
//                         if(fs.existsSync(project.image)) {
//                             path = paths.getPublicPath('projectAvatar', project._id.toString())
//                         }
//                         else path = paths.defaultProjectAvatarPath;
//                         project.image = path;
//                         project.image.markModified('personalData');
//                         project.image.save((err) => {
//                             if(doneCounter==0) done();
//                             doneCounter--;
//                             err ? console.log(err) : null;
//                         })
//                     })
//                 })
//             })}
//
//
//
//  }


