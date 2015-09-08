/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var debug = require('gulp-debug');
var connect = require('gulp-connect');
var plumber = require('gulp-plumber');
var changed = require('gulp-changed');
var resolve = require('gulp-resolve-dependencies');
var pseudoconcat = require('gulp-pseudoconcat-js');
var addsrc = require('gulp-add-src');
var lazypipe = require('lazypipe');
var babel = require('gulp-babel');
var common = require('./common');
var _ = require('underscore')
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var gzip = require('gulp-gzip');

var jsPipleline = lazypipe()
    .pipe(plumber)
    .pipe(babel)
    .pipe(common.replaceAll)
    .pipe(addsrc, 'dist/templates/*.js');
gulp.task("compile", function () {
    return gulp.src("src/**/*.js")
        .pipe(sourcemaps.init())
        .pipe(changed('dist'))
        .pipe(plumber())
        .pipe(debug())
        .pipe(jsPipleline())
        .pipe(sourcemaps.write('.', {sourceMappingURLPrefix: './../'}))
        .pipe(gulp.dest('dist/'))
        .pipe(connect.reload())

});


gulp.task('bundle', ['compile', 'templates'], function () {
    var dist = [];
    _.each("src/**/*.js", function (it) {
        dist.push(it.replace('src/', 'dist/'))
    })

    return gulp.src(["dist/**/*.js", "dist/templates/*.js"])
        .pipe(resolve())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(gulpif(common.prod, uglify({mangle: false})))
        .pipe(gulpif(common.watch, pseudoconcat(common.pkg.mainFile.main + ".js", {
            webRoot: 'src',
            host: 'http://localhost:' + common.pkg.port + '/'
        }), concat( common.pkg.mainFile+ ".js")))
        .pipe(gulpif(common.watch, replace('/dist/', '/')))
        .pipe(gulpif(common.watch, replace('http://localhost:' +  common.pkg.port  + '/../', 'http://localhost:' +  common.pkg.port  + '/')))
        .pipe(sourcemaps.write('.', {includeContent: !common.prod}))
        .pipe(debug())
        .pipe(replace('//# sourceMappingURL=../build/', '//# sourceMappingURL='))
        .pipe(gulp.dest('build/'))
        .pipe(gzip())
        .pipe(gulp.dest('build/'));
});
