/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var mainBowerFiles = require('gulp-main-bower-files');
var gutil = require('gulp-util');
var filter = require('gulp-filter');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var ignore = require('gulp-ignore');
var debug = require('gulp-debug');
var concat = require('gulp-concat');
var gzip = require('gulp-gzip');
var flatten = require('gulp-flatten');
var merge = require('merge-stream');
var _ = require('underscore');
var bowerJson = require('./common').bowerJson;
var prod = require('./common').prod;

module.exports = function (done)
{
    var bower_excludes = bowerJson.excludes.map(function (it)
    {
        return "**/" + it + "/**/*";
    });

    var bower_standalone = bowerJson.standalone.map(function (it)
    {
        return "**/" + it + "/**/*";
    });

    for (var i = 0; i < bowerJson.standalone.length; i++)
    {
        bowerConcat(filter('**/' + bowerJson.standalone[i] + "/**/*"), bowerJson.standalone[i]);
    }

    _.each(bowerJson.directories, function (dirs, dep)
    {
        console.log('coping ' + dirs + " for " + dep);

        dirs.forEach(function (dir)
        {
            var base = "bower_components/" + dep;
            gulp.src(base + "/" + dir, {base: base}).pipe(gulp.dest('build/'));
        });

    });

    if (bowerJson.excludes.length > 0 || bowerJson.standalone.length > 0)
    {
        bowerConcat(ignore.exclude(_.union(bower_excludes, bower_standalone)), 'dependencies', done);
    }
    else
    {
        bowerConcat(gutil.noop(), 'dependencies', done)
    }
};

function bowerConcat(expr, name)
{
    var js = bower()
        .pipe(expr)
        .pipe(filter('**/*.js'))
        .pipe(debug())
        .pipe(sourcemaps.init())
        .pipe(gulpif(prod, uglify({mangle: false})))
        .pipe(concat(name + '.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'));

    var css = bower()
        .pipe(expr)
        .pipe(filter('**/*.css'))
        .pipe(concat(name + '.css'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'));

    var other = bower()
        .pipe(expr)
        .pipe(filter(['**/*', '!**/*.css', '!**/*.js', '!**/*.less']))
        .pipe(flatten())
        .pipe(gulp.dest('build'));

    return merge(js, css, other)
}

function bower()
{
    if (bowerJson.overrides.length > 0)
    {
        return gulp.src('./bower.json').pipe(mainBowerFiles({overrides: bowerJson.overrides}))
    }
    else
    {
        return gulp.src('./bower.json').pipe(mainBowerFiles())
    }
}