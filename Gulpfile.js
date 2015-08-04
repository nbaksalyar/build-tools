var glue = require("gulp-sprite-glue");
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var coffee = require('gulp-coffee');
var del = require('del');
var gutil = require('gulp-util');
var git = require('gulp-git');
var uglify = require('gulp-uglify');
var minimist = require('minimist');
var mainBowerFiles = require('gulp-main-bower-files');
var gulpif = require('gulp-if');
var plumber = require('gulp-plumber');
var fs = require('fs');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var gzip = require('gulp-gzip');
var debug = require('gulp-debug');
var filter = require('gulp-filter');
var pseudoconcat = require('gulp-pseudoconcat-js');
var replace = require('gulp-replace');
var zip = require('gulp-zip');
var flatten = require('gulp-flatten');
var webserver = require('gulp-webserver');
var gulpmatch = require('gulp-match');
var ignore = require('gulp-ignore')
var _ = require('underscore');
var runSequence = require('run-sequence');
var handlebars = require('gulp-handlebars')
var wrap = require('gulp-wrap')
var declare = require('gulp-declare')
var addsrc = require('gulp-add-src');

var knownOptions = {
  string: 'env',
  default: { 
  	env: process.env.NODE_ENV || 'development',
  	watch: process.env.watch || false

  }
};

if (deploy) {
	deploy += '/work/webapps/'
} else {
	deploy = 'build/'
}

var deploy = process.env.WORK_DIR;
if (deploy) {
	deploy += '/work/webapps/'
} else {
	deploy = 'build'
}
console.log(deploy)
var options = minimist(process.argv.slice(2), knownOptions);
var bower_json = JSON.parse(fs.readFileSync('./bower.json', 'utf8'));
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

var prod = options.env === 'production'
var main =  '../build/' + pkg.mainFile + ".js";
var SOURCES = pkg.concatDist;
var bower_excludes = _.map(bower_json.excludes, function(it) {return "**/" + it + "/**/*"})


var bower = function() {
	return gulp.src('./bower.json')
        .pipe(mainBowerFiles( {overrides: bower.overrides}))
}

bower_concat = function(expr, name, cb) {
	bower()
		.pipe(expr)
		.pipe(filter('**/*.js'))
		.pipe(sourcemaps.init())
		.pipe(gulpif(prod, uglify())) 
		.pipe(concat(name + '.js'))		
		.pipe(sourcemaps.write('.'))		
		.pipe(gulp.dest('build'))
		.pipe(gzip())
		.pipe(gulp.dest('build'))

	bower()
		.pipe(expr)
		.pipe(filter('**/*.css'))		
		.pipe(concat(name + '.css'))
		.pipe(gulp.dest('build'))
		.pipe(gzip())
		.pipe(gulp.dest('build'))

	bower()
		.pipe(expr)
		.pipe(filter(['**/*', '!**/*.css', '!**/*.js', '!**/*.less']))	
		.pipe(flatten())	
		.pipe(gulp.dest('build'))
		.end(cb)
}


gulp.task('templates', function() {
	return gulp.src("src/**/*.hbs")	
		   .pipe(handlebars())		
		   .pipe(wrap('Handlebars.template(<%= contents %>)'))
		   .pipe(declare({
		      namespace: 'TEMPLATES',
		      root: 'window'
		    }))
		   	.pipe(flatten())
		    .pipe(gulp.dest('dist/templates'))
	 
})

gulp.task("dependencies",  function(cb) {
	for (var i = 0; i < bower_json.excludes.length; i++) {
		bower_concat(filter('**/' + bower_json.excludes[i] + "/**/*"), bower_json.excludes[i])
	}
	bower_concat(ignore.exclude(bower_excludes), 'dependencies', cb)
})

gulp.task("war",  function() {
	try {
		fs.unlinkSync('build/' + pkg.name + ".war")	
	} catch(ignore) {}

	return gulp.src("build/**/*")
			.pipe(gulpif(prod, gzip()))
			.pipe(zip(pkg.name + ".war"))
			.pipe(gulp.dest(deploy))


})

gulp.task("serve", function() {
	 gulp.src('dist')
    .pipe(webserver({
      livereload: true,
      directoryListing: true,
      open: false
    }));
})


gulp.task('clean', function (cb) {
  return del([
    'build/**/*',
    'dist/**/*'
  ], cb);
});


var build = function(pipe) {
	return pipe
	  	.pipe(sourcemaps.init())
		.pipe(babel())
	    .pipe(addsrc('dist/templates/*.js'))
	    .pipe(replace('@@version', pkg.version))
	    .pipe(replace('@@timestamp', new Date().toString()))	
}

gulp.task("watch", function() {
	gulp.watch('src/**/*.hbs', ['templates']);
	return 	build(gulp.src("src/**/*.js"))
	    .pipe(watch("src/**/*"))	   	
    	.pipe(sourcemaps.write('.'))
    	.pipe(gulp.dest('dist'))  
})

gulp.task("deploy", function(cb) {
	runSequence('clean', 'templates', ['compile', 'dependencies'],  function() {
		gulp.run('war')
	})
});


gulp.task("compile", function() {
	return build(gulp.src(SOURCES)
    	.pipe(sourcemaps.init()))
		.pipe(gulpif(prod, uglify()))
		.pipe(gulpif(options.watch, pseudoconcat(main, {webRoot: 'src', host: 'http://localhost:8000/'}), concat(main)))			
		.pipe(gulpif(options.watch, replace('/dist/', '/')))
    	.pipe(sourcemaps.write('.'))
    	.pipe(gulp.dest('build/'))
    	.pipe(gzip())
		.pipe(gulp.dest('build/'));
})

gulp.task('default', ['serve','watch']);


