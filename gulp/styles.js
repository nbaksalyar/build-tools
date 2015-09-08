/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var debug = require('gulp-debug');
var sourcemaps = require('gulp-sourcemaps');
var gzip = require('gulp-gzip');
var sass = require('gulp-sass');
var less = require('gulp-less');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var addsrc = require('gulp-add-src');
var connect = require('gulp-connect');

var main = require('./common').main;

gulp.task('styles', ['less', 'sass', 'css'], function (done)
{
    connect.reload();
    done();
});

gulp.task('sass', function ()
{
    return gulp.src(['style/!_*.sass', 'style/!_*.scss'])
        .pipe(plumber())
        .pipe(sass.sync())
        .pipe(gulp.dest('dist'))
});

gulp.task('less', function ()
{
    return gulp.src('style/!_*.less')
        .pipe(plumber())
        .pipe(debug())
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(replace('/*# sourceMappingURL=../build/', '/*# sourceMappingURL='))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'));
});

gulp.task('css', ['less', 'sass'], function ()
{
    return gulp.src(['dist/*.css', 'sprites/build/*.css', 'style/*.css'])
        .pipe(debug())
        .pipe(concat(main + ".css"))
        .pipe(debug())
        .pipe(addsrc('sprites/build/*.*'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'))
});

