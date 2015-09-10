/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var gulp = require('gulp');
var argv = require('optimist').argv;
var resources = require('./gulp/resources');
var bower = require('./gulp/bower');
var pack = require('./gulp/package');
var partials = require('./gulp/partials');
var templates = require('./gulp/templates');
var watchify = require('./gulp/watchify');
var webserver = require('./gulp/webserver');

console.log(require('optimist').argv.watch)

require('./gulp/styles');

gulp.task('resources', resources);
gulp.task('dependencies', ['resources'], bower);
gulp.task('package', ['all'], pack);
gulp.task('all', ['bundle', 'styles', 'resources']);
gulp.task('templates', ['partials'], templates);
gulp.task('partials', partials);
gulp.task('default', ['package', 'webserver', 'watch']);

if (argv.concat)
{
    require('./gulp/concat')
}
else
{
	gulp.task('compile', watchify);
	gulp.task('bundle', ['compile', 'templates'], require('./gulp/bundle'));
	gulp.task('webserver', webserver(8100));    
}

gulp.task('watch',function() {
	if (argv.concat) {
 		gulp.watch('src/**/*.js', ['compile']);
 	}
  	gulp.watch('src/**/*.hbs', ['templates']);
    gulp.watch('style/**/*.*', ['styles']);
    gulp.run('webserver')
});

