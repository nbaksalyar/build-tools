var os = require('os');
var fs = require('fs');
var child_process = require('child_process')

module.exports = {

    buildDir: function() {
        var EGISUI = '../EgisUI/build/';

        if (this.exists('./EgisUI.war')) {
            console.log('Unziping  EgisUI.war')
            this.sh("mkdir -p build/EgisUI && unzip -o EgisUI.war -d build/EgisUI/")
            EGISUI = 'build/EgisUI/';              
        }             
        
        console.log(EGISUI)
        return EGISUI;
    },

    exists: function(path) {
        return fs.statSync(path).isFile()
    },
    sh: function(cmd) {
        return child_process.execSync(cmd).toString('utf8')
    },


    defaultKarma: function (config) {

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

module.exports.buildDir()