var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var buffer = require('vinyl-buffer');
var assign = require('lodash.assign');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var pkg = require('./common').pkg;

module.exports = function()
{
        var customOpts = {
            entries: ['src/index.js'],
            debug: true
        };
        var opts = assign({}, watchify.args, customOpts);

        var watchifyBundle = watchify(
            browserify(opts)
                .transform('babelify')
                .transform('bulkify')
        );

        return watchifyBundle.bundle()
            .pipe(plumber())
            .pipe(source(pkg.name + '.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./dist'));
};