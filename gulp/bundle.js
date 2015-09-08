/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var gulpif = require('gulp-if');
var connect = require('gulp-connect');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gzip = require('gulp-gzip');

var pkg = require('./common').pkg;
var prod = require('./common').prod;

module.exports = function()
{
    return gulp.src(['dist/**/*.js', 'dist/templates/*.js'])
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(gulpif(prod, uglify({mangle: false})))
        .pipe(concat(pkg.name + '.js'))
        .pipe(sourcemaps.write('.', {includeContent: !prod}))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build/'))
        .pipe(connect.reload());
};