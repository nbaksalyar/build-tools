var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var buffer = require('vinyl-buffer');
var assign = require('lodash.assign');
var connect = require('gulp-connect');
var sourcemaps = require('gulp-sourcemaps');

module.exports = function(name)
{
    return function()
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
            .on('error', errorHandler)
            .pipe(source(name + '.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./dist'))
            .pipe(connect.reload());
    }
};

function errorHandler(error)
{
    console.error('Watchify Error:');
    console.error(error);
    this.emit('end');
}