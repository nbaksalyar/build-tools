var gulp = require('gulp');

module.exports = function ()
{
    gulp.watch([
            'src/**/*.js*'
        ],
        ['watchify']);
};