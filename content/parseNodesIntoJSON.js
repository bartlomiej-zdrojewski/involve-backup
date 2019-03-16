/**
 * Created by nopony on 26/10/2016.
 */

var fs = require('fs');
// String.prototype.replaceAll = function(search, replacement) {
//     var target = this;
//     return target.split(search).join(replacement);
// };
//
// Array.prototype.removeListed = function (list) {
//     var toBeReturned = this;
//     list = list.sort();
//     list.forEach(function (el, index) {
//         toBeReturned.splice(el - index, 1)
//     });
//     return toBeReturned;
// };


var nodes = {};
/**
 * FILE CONTAINS TSV NODE VALUES FORMATTED AS FOLLOWS:
 * TITLE, DEPICTION, DESCRIPTION, NODECODE, PARENTCODE \r\n
 *
 * By default, icon path is assumed to be the full NODECODE (with PARENTCODE appended at the beginning)
 * IF no icon is present at the default path, the path to the placeholder item is used (/images/nodes/default.svg)
 */

var missingIconCounter = 0;
var arrayOfNodes = fs.readFileSync('./nodes.tsv').toString().trim().split('\r\n');
var arrayOfNodeObjects = arrayOfNodes.map(function (NodeAsString) {
    var tmpArray = NodeAsString.trim().split('\t');
    if(tmpArray[4] == undefined) tmpArray[4] = '';
    var iconPath = (fs.existsSync('/../public/images/nodes/' + tmpArray[4] + tmpArray[3] + '.svg')) ? + '/' + tmpArray[4] + tmpArray[3] + '.svg' : '/default.svg';
    if(iconPath == '/default.svg') missingIconCounter++;
    return {
        title: tmpArray[0],
        depiction: tmpArray[1],
        description: tmpArray[2],
        nodeCode: tmpArray[3],
        parentCode: tmpArray[4],
        icon: iconPath
    }
});

if(missingIconCounter > 0) {
    console.warn('Some node icons could not be accessed. They were replaced with defaults');
    console.warn('Currently, ' + (arrayOfNodeObjects.length - missingIconCounter) + ' out of ' + arrayOfNodeObjects.length + ' icons are present.');
}

arrayOfNodeObjects.forEach(function (nodeObject, index, array) {
    if(nodeObject.parentCode == undefined) nodeObject.parentCode = '';
    nodeObject.nodeCode = nodeObject.parentCode + nodeObject.nodeCode;
});

fs.writeFileSync('.nodestorage.json', JSON.stringify(arrayOfNodeObjects));
