/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var gulpif = require('gulp-if');
var addsrc = require('gulp-add-src');
var zip = require('gulp-zip');
var exit = require('gulp-exit');
var del = require('del');
var rename = require('gulp-rename');

var pkg = require('./common').pkg;
var deploy = require('./common').deploy;
var prod = require('./common').prod;

module.exports = function()
{
    var file = pkg.name + (pkg.plugin ? ".zip" : ".war");
    del.sync('build/' + file);
    console.log('Deploying to ' + deploy + "/" + file);
    return gulp.src(["build/**/*", '!**/' + file, '!build/' + pkg.name + '/**/*'])
        .pipe(addsrc("dist/*.png"))
        .pipe(gulpif(pkg.plugin != null, rename({dirname: "System/plugins/" + pkg.plugin})))
        .pipe(zip(file))
        .pipe(gulp.dest(deploy))
        .pipe(gulp.dest('.'))
        .pipe(gulpif(prod, exit()));
};
