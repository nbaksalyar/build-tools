/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var flatten = require('gulp-flatten');

module.exports = function()
{
    return gulp.src("src/**/*.hbs")
        .pipe(plumber())
        .pipe(handlebars())
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declare({
            namespace: 'TEMPLATES',
            root: 'window'
        }))
        .pipe(flatten())
        .pipe(gulp.dest('dist/templates'));
};
