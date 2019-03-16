/**
 * Created by nopony on 11/02/2017.
 */

var fs = require('fs');

module.exports.init = function () {
    var Cases = (fs.existsSync('./content/.casestorage.json')) ? JSON.parse(fs.readFileSync('./content/.casestorage.json').toString()) : null;

    if(Cases == null) {
        // console.log('.casestorage file failed to load');
        // console.log('You probably need to parse cases into JSON format first');
        return
    }

    // else console.log('Case storage initiated!');
    return {
        allCases: Cases,
        getCaseById: function (id) {
            let result = null;
            Cases.forEach(function (caseObj) {
                if(caseObj.hash == id) result = caseObj;
            });
            return result
        }
        // /**
        //  *
        //  * @param code {string} code of the node to search for
        //  * @returns {Object}
        //  */
        // getCoursesByCode: function (code) {
        //     var codeRegex = new RegExp(code + '.{0, 12}');
        //     var ReturnedCourses = [];
        //     Cases.forEach(function (course) {
        //         if(course.code == code) ReturnedCourses.push(course);
        //     });
        //     return ReturnedCourses;
        // }
    }
    
    
};