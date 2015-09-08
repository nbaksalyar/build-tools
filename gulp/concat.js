/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var debug = require('gulp-debug');
var plumber = require('gulp-plumber');
var changed = require('gulp-changed');
var addsrc = require('gulp-add-src');
var lazypipe = require('lazypipe');
var babel = require('gulp-babel');
var replaceAll = require('./common').replaceAll;

var jsPipleline = lazypipe()
    .pipe(plumber)
    .pipe(babel)
    .pipe(replaceAll)
    .pipe(addsrc, 'dist/templates/*.js');

module.exports = function()
{
    return gulp.src("src/**/*.js")
        .pipe(sourcemaps.init())
        .pipe(changed('dist'))
        .pipe(plumber())
        .pipe(debug())
        .pipe(jsPipleline())
        .pipe(sourcemaps.write('.', {sourceMappingURLPrefix: './../'}))
        .pipe(gulp.dest('dist/'))
};