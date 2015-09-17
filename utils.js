var os = require('os');
var fs = require('fs');
var path = require('path');
var argv = require('optimist').argv;
var mkdirp = require('mkdirp');
var child_process = require('child_process');

module.exports = {

    buildDir: function ()
    {
        var EGISUI = path.normalize('../EgisUI/build/');

        if (this.exists('./EgisUI.war'))
        {
            EGISUI = 'build/EgisUI/';
            this.unzip("./EgisUI.war", EGISUI)
        }

        console.log(EGISUI);
        return EGISUI;
    },


    unzip: function (path, to)
    {

        mkdirp(to);
        this.sh("unzip -o " + path + " -d " + to);
    },

    sh: function (cmd)
    {
        return child_process.execSync(cmd).toString('utf8').trim()
    },

    exists: function (path)
    {
        try
        {
            fs.statSync(path);
        }
        catch (err)
        {
            if (err.code == 'ENOENT')
            {
                return false;
            }
        }
        return true;

    },
     dateFormat: function(date, fstr, utc) {
      utc = utc ? 'getUTC' : 'get';
      return fstr.replace (/%[YmdHMS]/g, function (m) {
        switch (m) {
        case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
        case '%m': m = 1 + date[utc + 'Month'] (); break;
        case '%d': m = date[utc + 'Date'] (); break;
        case '%H': m = date[utc + 'Hours'] (); break;
        case '%M': m = date[utc + 'Minutes'] (); break;
        case '%S': m = date[utc + 'Seconds'] (); break;
        default: return m.slice (1); // unknown code, remove %
        }
        // add leading zero if required
        return ('0' + m).slice (-2);
      });
    },
    defaultKarma: function (config)
    {
        this.buildDir();
        var hostname = argv.host || process.env['IP'] || this.ip();

        var webdriverConfig = "http://hub.papertrail.co.za:4444/wd/hub";
        config.set({
            junitReporter: {
                outputDir: 'test-output/junit/' // results will be saved as $outputDir/$browserName.xml
                //outputFile: undefined // if included, results will be saved as $outputDir/$browserName/$outputFile
                //suite: ''
            },
            hostname: hostname.split(' ').join(''),
            basePath: '',
            frameworks: ['jasmine-jquery', 'jasmine'],
            exclude: [],
            preprocessors: {
                '**/*.coffee': ['coffee'],
                '**/*.js': ['sourcemap']
            },
            coffeePreprocessor: {
                // options passed to the coffee compiler
                options: {
                    bare: true,
                    sourceMap: true
                },
                // transforming the filenames
                transformPath: function (path)
                {
                    return path.replace(/\.coffee$/, '.js')
                }
            },
            customLaunchers: {
                'REMOTE-IE11': {
                    base: 'WebDriver',
                    config: webdriverConfig,
                    browserName: 'internet explorer',
                    name: 'Karma',
                    pseudoActivityInterval: 30000
                },
                'REMOTE-FF': {
                    base: 'WebDriver',
                    config: webdriverConfig,
                    browserName: 'firefox',
                    name: 'Karma',
                    pseudoActivityInterval: 30000
                },
                'REMOTE-Chrome': {
                    base: 'WebDriver',
                    config: webdriverConfig,
                    browserName: 'chrome',
                    name: 'Karma',
                    pseudoActivityInterval: 30000
                }
            }
        });
    },

    allBrowsers: function ()
    {
        return ['REMOTE-IE11', 'REMOTE-FF', 'REMOTE-Chrome'];
    },

    ip: function ()
    {
        var ifaces = os.networkInterfaces();
        var ip;
        Object.keys(ifaces).forEach(function (ifname)
        {
            ifaces[ifname].forEach(function (iface)
            {

                if ('IPv4' !== iface.family || iface.internal !== false || iface.address.startsWith('172'))
                {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }
                ip = iface.address;
            });

        });
        return ip;
    }
};

