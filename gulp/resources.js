/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var replaceAll = require('./common').replaceAll;

module.exports = function ()
{
    gulp.src('resources/**/*')
        .pipe(gulp.dest("build"))
        .pipe(replaceAll());

    return gulp.src("*.html")
        .pipe(replaceAll())
        .pipe(gulp.dest("build"));
};