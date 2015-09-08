/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var argv = require('optimist').argv;
var resources = require('./gulp/resources');
var bower = require('./gulp/bower');
var pack = require('./gulp/package');
var bundle = require('./gulp/bundle');
var partials = require('./gulp/partials');
var templates = require('./gulp/templates');
var concat = require('./gulp/concat');
var watchify = require('./gulp/watchify');
var webserver = require('./gulp/webserver');
var watch = require('./gulp/watch');

require('./gulp/styles');

gulp.task('resources', resources);
gulp.task('dependencies', ['resources'], bower);
gulp.task('package', ['all'], pack);
gulp.task('all', ['bundle', 'styles', 'resources']);
gulp.task('bundle', ['compile', 'partials'], bundle);
gulp.task('templates', ['partials'], templates);
gulp.task('partials', partials);
gulp.task('watch', watch);
gulp.task('webserver', webserver(8100));
gulp.task('default', ['package', 'webserver', 'watch']);

console.log('concat: ', argv.concat);

if (argv.concat)
{
    gulp.task('compile', concat);
}
else
{
    gulp.task('compile', watchify);
}