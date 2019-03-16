/**
 * Created by nopony on 11/02/2017.
 */

var fs = require('fs');

module.exports.init = function () {
    var Courses = (fs.existsSync('./content/.coursestorage.json')) ? JSON.parse(fs.readFileSync('./content/.coursestorage.json').toString()) : null;

    if(Courses == null) {
        // console.log('.coursestorage file failed to load');
        // console.log('You probably need to parse courses into JSON format first');
        return
    }
    return {
        allCourses: Courses,
        /**
         *
         * @param code {string} code of the node to search for
         * @returns {Object}
         */
        getCoursesByCode: function (code) {
            var codeRegex = new RegExp(code + '.{0, 12}');
            var ReturnedCourses = [];
            Courses.forEach(function (course) {
                if(course.code == code) ReturnedCourses.push(course);
            });
            return ReturnedCourses;
        }
    }
    
    
};