/**
 * Created by Nikolay Glushchenko <nick@nickalie.com> on 08.09.2015.
 */

var fs = require('fs');
var minimist = require('minimist');
var lazypipe = require('lazypipe');
var replace = require('gulp-replace');
var utils = require('../utils');
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
var gitHash = utils.sh('git rev-parse --short HEAD');
var timestamp = utils.dateFormat(new Date(), '%Y-%m-%d %H:%M:%S')
var replaceAll = lazypipe()
    .pipe(function ()
    {
        return replace('@@version', pkg.version + " " + gitHash)
    })
    .pipe(function ()
    {
        return replace('@@js_suffix', '.js?rel=' + gitHash)
    })
    .pipe(function ()
    {
        return replace('@@css_suffix', '.css?rel=' + gitHash)
    })
    .pipe(function ()
    {
        return replace('@@timestamp', timestamp)
    });

module.exports = {
    deploy: deploy,
    pkg: pkg,
    bowerJson: bowerJson,
    watch: options.watch,
    prod: options.env === 'production',
    main: main,
    replaceAll: replaceAll
};