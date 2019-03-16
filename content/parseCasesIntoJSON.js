/**
 * Created by nopony on 10/10/2016.
 */
var fs = require('fs');
var buff = fs.readFileSync('cases.tsv');
var crypto = require('crypto');

var arrays = buff.toString().trim().split(/\r?\n/).map(function (string) {
    return string.split('\t')
});
// console.log(arrays);
var TopicArray = [];
arrays.forEach(function (caseString) {
    var abilityCodes = caseString[4].split(', ');
    var newAbilityCodes = [];
    abilityCodes.forEach(function (codeAndLevel) {
        newAbilityCodes.push({
            code: codeAndLevel.split('=')[0].trim(),
            level: parseInt(codeAndLevel.split('=')[1])
        })
    });
    let httpRegex = new RegExp('^(http|https)://');
    if(!httpRegex.test(caseString[6]))
        caseString[6] = "http://" + caseString[6];
    var caseObj = {
        title: caseString[0],
        depiction: caseString[1],
        description: caseString[2],
        requirements: caseString[3],
        relatedAbilityCodes: newAbilityCodes,
        image: caseString[5],
        link: caseString[6],
        hash: crypto.randomBytes(16).toString('hex')
    };
    TopicArray.push(caseObj);
});

fs.writeFileSync('.casestorage.json', JSON.stringify(TopicArray));