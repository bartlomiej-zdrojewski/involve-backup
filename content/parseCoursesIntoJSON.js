/**
 * Created by nopony on 10/10/2016.
 */
var fs = require('fs');
var buff = fs.readFileSync('nauka.tsv');


Array.prototype.includes = function (primitive) {
    for(var i = 0; i < this.length; i++) if(this[i] == primitive) return true;
};

Array.prototype.quickMap = function (property) {
    return this.map(function (el) {
        return el[property];
    })
};

var arrays = buff.toString().trim().split(/\r?\n/).map(function (string) {
    return string.split(',')
});
// console.log(arrays);
var TopicArray = [];
arrays.forEach(function (course) {
    var courseObj = {
        code: course[0],
        title: course[1],
        link: course[2],
        description: course[3],
        level: course[4],
        type: course[5],
        source: course[6]
    };
    TopicArray.push(courseObj);
});

fs.writeFileSync('.coursestorage.json', JSON.stringify(TopicArray));