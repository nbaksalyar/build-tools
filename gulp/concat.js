/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var filter = require('gulp-filter');
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
var webserver = require('gulp-webserver');
var replace = require('gulp-replace');
var gzip = require('gulp-gzip');

var jsPipleline = lazypipe()
    .pipe(plumber)
    .pipe(function() { 
        return babel({
        highlightCode: true,
        modules: 'ignore'
        })
    })
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

var port = common.pkg.port || 8101;
var main = common.pkg.mainFile;
console.log('port=' + port);
console.log('main=' + main);
console.log('watch=' + common.watch);


gulp.task("webserver", function () {
    gulp.src(['dist', 'build'])
        .pipe(webserver({
            port: port ,
            livereload: true,
            directoryListing: true,
            open: false
        }));
})

gulp.task('bundle', ['compile', 'templates'], function () {
    var dist = [];
    _.each("src/**/*.js", function (it) {
        dist.push(it.replace('src/', 'dist/'))
    })

    return gulp.src(["dist/**/*.js", "dist/templates/*.js"])
        .pipe(resolve())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(gulpif(common.prod, uglify({mangle: false})))
        .pipe(gulpif(common.watch, pseudoconcat(main + ".js", {
            webRoot: 'src',
            host: 'http://localhost:' + port + '/'
        }), concat( main + ".js")))
        .pipe(gulpif(common.watch, replace('/dist/', '/')))
        .pipe(gulpif(common.watch, replace('http://localhost:' +  port  + '/../', 'http://localhost:' +  port  + '/')))
        .pipe(sourcemaps.write('.', {includeContent: !common.prod}))
        .pipe(debug())
        .pipe(replace('//# sourceMappingURL=../build/', '//# sourceMappingURL='))
        .pipe(gulp.dest('build/'))
        .pipe(gzip())
        .pipe(gulp.dest('build/'));
});
