/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var fs = require('fs');
var minimist = require('minimist');
var lazypipe = require('lazypipe');
var replace = require('gulp-replace');

var deploy = process.env.WORK_DIR;

var knownOptions = {
    string: 'env',
    default: {
        env: process.env.NODE_ENV || 'development',
        watch: process.env.watch || false

    }
};

var options = minimist(process.argv.slice(2), knownOptions);

if (deploy != null)
{
    deploy += '/work/';
}
else
{
    deploy = 'build/';
}

var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
var main = '../build/' + pkg.mainFile;
var bowerJson = {};

if (pkg.plugin != null)
{
    deploy += "plugins";
}
else
{
    deploy += "webapps";
    bowerJson = JSON.parse(fs.readFileSync('./bower.json', 'utf8'));
}

bowerJson.excludes = bowerJson.excludes || [];
bowerJson.standalone = bowerJson.standalone || [];
bowerJson.directories = bowerJson.directories || {};
bowerJson.overrides = bowerJson.overrides || {};

var replaceAll = lazypipe()
    .pipe(function ()
    {
        return replace('@@version', pkg.version)
    })
    .pipe(function ()
    {
        return replace('@@js_suffix', '.js?rel=' + new Date().getTime())
    })
    .pipe(function ()
    {
        return replace('@@css_suffix', '.css?rel=' + new Date().getTime())
    })
    .pipe(function ()
    {
        return replace('@@timestamp', new Date().toString())
    });

module.exports = {
    deploy: deploy,
    pkg: pkg,
    bowerJson: bowerJson,
    prod: options.env === 'production',
    main: main,
    replaceAll: replaceAll
};