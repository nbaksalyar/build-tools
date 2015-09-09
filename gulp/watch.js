var gulp = require('gulp');

module.exports = function ()
{
    gulp.watch([
            'src/**/*.js*',
            'src/**/*.hbs'
        ],
        ['bundle']);

    gulp.watch('style/**/*.*', ['styles']);
    gulp.run('serve')
};