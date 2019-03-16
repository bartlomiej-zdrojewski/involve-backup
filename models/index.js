const fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose');


const items = fs.readdirSync(path.join(__dirname));

module.exports = {};
items.forEach((item) => {
    if(item === 'index.js' || item === 'methods' || item === 'schemas') return;

    item = item.substr(0, item.length - 3);
    const modelName = item[0].toUpperCase() + item.substr(1);
    module.exports[modelName] = require(path.join(__dirname, item));
});

module.exports.Project = require(path.join(__dirname, 'project'));
module.exports.NewUserInvitation = require(path.join(__dirname, 'newUserInvitation'));
module.exports.Report = require(path.join(__dirname, 'report'));
module.exports.Ticket = require(path.join(__dirname, 'ticket'));
module.exports.User = require(path.join(__dirname, 'user'));

//module.exports.user = require(__dirname + '/user');
