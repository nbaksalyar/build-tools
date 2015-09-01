var connect = require('gulp-connect');

module.exports = function (port)
{
    return function()
    {
        return connect.server({
            livereload: true,
            root: process.cwd(),
            port: port
        });
    }
};