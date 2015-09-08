/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var path = require('path');

module.exports = function ()
{
    return gulp.src(['src/**/_*.hbs'])
        .pipe(plumber())
        .pipe(handlebars())
        .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
            imports: {
                processPartialName: function (fileName)
                {
                    // Strip the extension and the underscore
                    // Escape the output with JSON.stringify
                    return JSON.stringify(path.basename(fileName, '.js').substr(1));
                }
            }
        }))
        .pipe(concat('partials.js'))
        .pipe(gulp.dest('dist/templates'));
};