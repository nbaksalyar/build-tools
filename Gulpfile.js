var glue = require("gulp-sprite-glue");
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var coffee = require('gulp-coffee');
var del = require('del');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var minimist = require('minimist');
var mainBowerFiles = require('gulp-main-bower-files');
var gulpif = require('gulp-if');
var plumber = require('gulp-plumber');
var fs = require('fs');
var watch = require('gulp-watch');
var rename = require('gulp-rename');
var gzip = require('gulp-gzip');
var debug = require('gulp-debug');
var filter = require('gulp-filter');
var replace = require('gulp-replace');
var zip = require('gulp-zip');
var flatten = require('gulp-flatten');
var ignore = require('gulp-ignore');
var connect = require('gulp-connect');
var _ = require('underscore');
var runSequence = require('run-sequence');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var addsrc = require('gulp-add-src');
var merge = require('merge-stream');
var lazypipe = require('lazypipe');
var sass = require('gulp-sass');
var less = require('gulp-less');
var path = require('path');
var utils = require('./utils.js');
var webserver = require('./gulp/webserver');
var watchify = require('./gulp/watchify');
var os = require('os');

var knownOptions = {
    string: 'env',
    default: {
        env: process.env.NODE_ENV || 'development',
        watch: process.env.watch || false

    }
};

var deploy = process.env.WORK_DIR;
if (deploy != null ) {
    deploy += '/work/'
} else {
    deploy = 'build/'
}


var bower_json = {};
var options = minimist(process.argv.slice(2), knownOptions);
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

if (pkg.plugin != null) {
    deploy += "plugins"

} else {
    deploy += "webapps";
    bower_json = JSON.parse(fs.readFileSync('./bower.json', 'utf8'));
}


var prod = options.env === 'production';
var main = '../build/' + pkg.mainFile;
var SOURCES = pkg.concatDist;
if (SOURCES == null) {
    SOURCES = "src/**/*.js"
}
var port = pkg.port || 8000;

var replaceAll = lazypipe()
    .pipe(function () {
        return replace('@@version', pkg.version)
    })
    .pipe(function () {
        return replace('@@js_suffix', '.js?rel=' + new Date().getTime())
    })
    .pipe(function () {
        return replace('@@css_suffix', '.css?rel=' + new Date().getTime())
    })
    .pipe(function () {
        return replace('@@timestamp', new Date().toString())
    });

var bower = function () {
    if (_.size(bower.overrides) > 0) {
        return gulp.src('./bower.json').pipe(mainBowerFiles({overrides: bower.overrides}))
    }
    return gulp.src('./bower.json').pipe(mainBowerFiles())

};

bower_concat = function (expr, name, cb) {
    var js = bower()
        .pipe(expr)
        .pipe(filter('**/*.js'))
        .pipe(debug())
        .pipe(sourcemaps.init())
        .pipe(gulpif(prod, uglify({mangle: false})))
        .pipe(concat(name + '.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'));

    var css = bower()
        .pipe(expr)
        .pipe(filter('**/*.css'))
        .pipe(concat(name + '.css'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'));

    var other = bower()
        .pipe(expr)
        .pipe(filter(['**/*', '!**/*.css', '!**/*.js', '!**/*.less']))
        .pipe(flatten())
        .pipe(gulp.dest('build'));

    return merge(js, css, other)
};


var build = function (pipe) {
    return pipe
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(replaceAll())
};

gulp.task('templates', ['partials'], function () {
    return gulp.src("src/**/*.hbs")
        .pipe(plumber())
        .pipe(handlebars())
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declare({
            namespace: 'TEMPLATES',
            root: 'window'
        }))
        .pipe(flatten())
        .pipe(gulp.dest('dist/templates'))
        .pipe(connect.reload())

});

gulp.task('partials', function () {
    // Assume all partials start with an underscore
    // You could also put them in a folder such as source/templates/partials/*.hbs
    gulp.src(['src/**/_*.hbs'])
        .pipe(plumber())
        .pipe(handlebars())
        .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
            imports: {
                processPartialName: function (fileName) {
                    // Strip the extension and the underscore
                    // Escape the output with JSON.stringify
                    return JSON.stringify(path.basename(fileName, '.js').substr(1));
                }
            }
        }))
        .pipe(concat('partials.js'))
        .pipe(gulp.dest('dist/templates'))
        .pipe(connect.reload());
});

gulp.task('sprites', function (cb) {

    //TODO sprites task hangs on windows
    //need to find workaround
    if (os.platform().indexOf('win') === 0)
    {
        cb();
    }

    if (!utils.exists('sprites/')) {
        cb();
        return;
    }
    del.sync("sprites/build/*");

    return gulp.src(['sprites/**/*'])
        .pipe(glue({
            url: './',
            recursive: true,
            source: './sprites/',
            quiet: true,
            output: './sprites/build/',
            css: 'sprites/build/'
        }, function () {
            cb();
        }))
});

gulp.task('sass', function (cb) {
    return gulp.src(['style/*.sass', 'style/main.scss'])
          .pipe(plumber())
        .pipe(sass.sync())
        .pipe(gulp.dest('dist'))
});

gulp.task('less', function (cb) {
    return gulp.src('style/theme.less')
        .pipe(plumber())
        .pipe(debug())
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(replace('/*# sourceMappingURL=../build/', '/*# sourceMappingURL='))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'))
        .pipe(connect.reload())
});

gulp.task('css', function (cb) {
    return gulp.src(['dist/*.css', 'sprites/build/*.css', 'style/*.css'])
                .pipe(debug())
        .pipe(concat(main + ".css"))
        .pipe(debug())
        .pipe(addsrc('sprites/build/*.*'))
        .pipe(gulp.dest('build'))
        .pipe(gzip())
        .pipe(gulp.dest('build'))
});


gulp.task('styles', function (cb) {
    runSequence(['less', 'sass'], 'sprites', 'css', cb)
});

gulp.task("dependencies", ['resources'], function (cb) {

    var bower_excludes = _.map(bower_json.excludes, function (it) {
        return "**/" + it + "/**/*"
    });

    var bower_standalone = _.map(bower_json.standalone, function (it) {
        return "**/" + it + "/**/*"
    });

    for (var i = 0; i < _.size(bower_json.standalone); i++) {
        bower_concat(filter('**/' + bower_json.standalone [i] + "/**/*"), bower_json.standalone[i])
    }

    _.each(bower_json.directories || [], function (dirs, dep) {
        console.log('coping ' + dirs + " for " + dep);

        _.each(dirs, function(dir) {
            var base = "bower_components/" + dep;
            gulp.src(base + "/" + dir, {base: base}).pipe(gulp.dest('build/'))
        })

    });

    if (_.size(bower_json.excludes) > 0 || _.size(bower_json.standalone) > 0) {
        bower_concat(ignore.exclude(_.union(bower_excludes, bower_standalone)), 'dependencies', cb)
    } else {
        bower_concat(gutil.noop(), 'dependencies', cb)
    }
});

gulp.task("package", ['all'], function () {
    var file = pkg.name + (pkg.plugin ? ".zip" : ".war");
    del.sync('build/' + file);
    console.log('Deploying to ' + deploy + "/" + file);
    return gulp.src("build/**/*")
        .pipe(addsrc("dist/*.png"))
        .pipe(gulpif(pkg.plugin != null, rename({dirname: "System/plugins/" + pkg.plugin})))
        .pipe(zip(file))
        .pipe(gulp.dest(deploy))
        .pipe(gulp.dest('.'));
});

gulp.task('resources', function () {
    var other = gulp.src('resources/**/*')
        .pipe(gulp.dest("build"))
        .pipe(replaceAll());

    var html = gulp.src("*.html")
        .pipe(replaceAll())
        .pipe(gulp.dest("build"));

    return html;

});

gulp.task("webserver", webserver(port));

gulp.task('clean', function (cb) {
    return del([
        'build/**/*',
        'dist/**/*'
    ], cb);
});


gulp.task('watch', ['package'], function () {
    gulp.watch(['src/**/*.hbs', 'src/**/*.js'], ['bundle']);
    gulp.watch('style/**/*.*', ['styles', 'package']);
    gulp.watch('*.html', ['package']);
    gulp.run('webserver');
});

gulp.task('bundle', ['compile', 'templates'], function () {
    return gulp.src(['dist/' + pkg.name + '.js', 'dist/templates/*.js'])
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(concat(pkg.name + '.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build'))
        .pipe(connect.reload());
});

gulp.task('all', ['bundle', 'styles', 'resources']);
gulp.task("compile", watchify(pkg.name));
gulp.task('default', ['watch']);