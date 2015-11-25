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
var through2 = require('through2');

var jsPipleline = lazypipe()
    .pipe(plumber)
    .pipe(function () {
        return annotateDependencies();
    })
    .pipe(function() { 
        return babel({
        highlightCode: true,
        modules: 'ignore'
        })
    })
    .pipe(common.replaceAll)
    .pipe(addsrc, 'dist/templates/*.js');

gulp.task("compile",function () {
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

gulp.task("webserver", function () {
    gulp.src(['dist', 'build'])
        .pipe(webserver({
            host: '0.0.0.0',
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

/**
 * Adds @requires annotations for correct dependencies ordering
 * in concatenated files.
 */
function annotateDependencies() {
    var importsRe = /import.+?\s+from?\s+['"](.*?\.js)['"]/g;

    return through2.obj(function (file, enc, cb) {
        if (file.isBuffer()) {
            var src = file.contents.toString('utf8');
            var imports = [];

            for (var match; match = importsRe.exec(src); match) {
                imports.push(match[1]);
            }

            var deps = imports.reduce(function (str, dep) {
                return str + "* @requires " + dep + "\n";
            }, '');
            var dst = src + "\n/*\n" + deps + "*/";
            file.contents = new Buffer(dst);
        }
        cb(null, file);
    });
}
