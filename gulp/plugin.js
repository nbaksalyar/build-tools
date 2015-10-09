var utils = require('../utils');
var gulp = require('gulp');
var debug = require('gulp-debug');
var gulpif = require('gulp-if');
var replace = require('gulp-replace');
var addsrc = require('gulp-add-src');
var zip = require('gulp-zip');
var concat = require('gulp-concat');
var exit = require('gulp-exit');
var del = require('del');
var pseudoconcat = require('gulp-pseudoconcat-js');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var common = require('./common');

gulp.task('plugin_concat', ['compile', 'templates'], function() {
     return gulp.src(["dist/**/*.js", "dist/templates/*.js"])  
        .pipe(concat( common.main + ".js"))
        .pipe(gulpif(common.watch, replace('/dist/', '/')))
        .pipe(gulpif(common.watch, replace('http://localhost:' +  common.port  + '/../', 'http://localhost:' +  common.port  + '/')))
        .pipe(debug())
        .pipe(gulp.dest('build/'))
});

gulp.task('plugin', ['plugin_concat'], function() {
    var file = common.pkg.name + (common.pkg.plugin ? ".zip" : ".war");
    del.sync('tmp');
    utils.sh("mkdir -p tmp/System/plugins/" + common.pkg.plugin + "/")
    utils.sh("mkdir -p tmp/PT-SCRIPTS");
    utils.sh("cp install.groovy tmp/PT-SCRIPTS/");
    utils.sh("cp -R resources/* tmp/")
    utils.sh("cp -R build/* tmp/System/plugins/" + common.pkg.plugin + "/")
    console.log('Deploying to ' + common.deploy + "/" + file);
    return gulp.src(["tmp/**/*"])
        .pipe(zip(file))
        .pipe(gulp.dest(common.deploy))
        .pipe(gulp.dest('.'))
})

gulp.task("plugin_watch", ['plugin'], function() {
    gulp.watch('src/**/*', ['plugin']);
})