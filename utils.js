var os = require('os');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

module.exports = {

    buildDir: function () {
        var EGISUI = path.normalize('../EgisUI/build/')

        if (this.exists('./EgisUI.war')) {
            EGISUI = 'build/EgisUI/';
            this.unzip("./EgisUI.war", EGISUI)
        }

        console.log(EGISUI);
        return EGISUI;
    },
    

    unzip: function(path, to) {


        this.sh("mkdir -p " + to);
        this.sh("unzip -o " + path + " -d " + to);
        var count = this.sh("ls -l build/EgisUI | wc -l");
        console.log('Unzipped ' + count + " files from " + path + " to " + to);

    },

    exists: function (path) {
        try {
            fs.statSync(path);
        } catch (err) {
            if (err.code == 'ENOENT') return false;
        }
        return true;

    },
    sh: function (cmd) {
        return child_process.execSync(cmd).toString('utf8').trim()
    },


    defaultPipleline: function(config) {

    },

    defaultKarma: function (config) {
        this.buildDir()

        var webdriverConfig = "http://hub.papertrail.co.za:4444/wd/hub";
        config.set({
            junitReporter: {
                outputDir: 'test-output/', // results will be saved as $outputDir/$browserName.xml
                //outputFile: undefined // if included, results will be saved as $outputDir/$browserName/$outputFile
                //suite: ''
            },
            hostname: process.env['IP'] || this.ip(),
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
                transformPath: function (path) {
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

    allBrowsers: function () {
        return ['REMOTE-IE11', 'REMOTE-FF', 'REMOTE-Chrome'];
    },

    ip: function () {
        var ifaces = os.networkInterfaces();
        var ip;
        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {

                if ('IPv4' !== iface.family || iface.internal !== false || iface.address.startsWith('172')) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }
                ip = iface.address;
            });

        });
        return ip;
    }
};

