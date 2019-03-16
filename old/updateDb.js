/**
 * Created by nopony on 07.06.17.
 */
var dotenv = require('dotenv').load();
var mongoose = require('mongoose');
var dbPort = process.env.DB_PORT;
var crypto = require('crypto');
var m = require('./models');
//const oM = require('./oldmodels');
var fs = require('fs');
var txts = require('./texts');
var MongoClient = require('mongodb').MongoClient;

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Name your current database:', (db) => {
    MongoClient.connect('mongodb://localhost/' + db, function(err, db) {
        if(err) {
            console.log('Could not connect to your current database, aborting');
            rl.close();
        }
        else {
            db.collection('projects').find().toArray((err, allProjects) => {
                err ? console.log(err) : null;
                allProjects.forEach((project) => {
                    project.members = getMapped(['id', 'online'], project.members);
                    project.applications = getMapped(['id', 'description', 'explanation', 'roles'], project.applications);
                    project.roles.forEach((role) => {
                        role.members = role.members.map((member) => {
                            return member.id
                        })
                    })
                    project.roles = getMapped(['title', 'description', 'recruitment', 'skill', 'members'], project.roles);
                })

                db.collection('users').find().toArray((err, allUsers) => {
                    allUsers.forEach((user) => {
                        user.projects.map((project) => {return project.id});

                    })

                    fs.writeFile('./exportProjects.json', JSON.stringify(allProjects), (err) => {
                        err ? console.log(err): console.log('exported projects');

                        fs.writeFile('./exportUsers.json', JSON.stringify(allUsers), (err) => {
                            err ? console.log(err): console.log('exported users');
                            console.log('done');
                        })

                        db.close();
                    });

                })


            })
        }

    });

    rl.close();
});

// m.User.find({}, (err, allUsers) => {
//     allUsers.forEach((user) => {
//         user.projects = user.projects.map((project)=>{return project.id});
//         user.markModified('projects');
//         user.save((err) => {
//             err ? console.log(err):null;
//             console.log(counter);
//             counter++;
//         })
//     })
// });

function getMapped (props, arrayOfObj) {
    return arrayOfObj.map((obj) => {
        let retObj = {};
        props.forEach((prop) => {
            retObj[prop] = obj[prop];
        })
        return retObj;
    })
}




