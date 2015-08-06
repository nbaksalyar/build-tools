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
var merge = require('merge-stream')
var lazypipe = require('lazypipe');
var glue = require("gulp-sprite-glue");
var sass = require('gulp-sass');
var less = require('gulp-less');
var cached  = require('gulp-cached');
var order = require("gulp-order");
var changed = require('gulp-changed');
var resolve = require('gulp-resolve-dependencies');
var livereload = require('gulp-livereload');

var knownOptions = {
  string: 'env',
  default: { 
  	env: process.env.NODE_ENV || 'development',
  	watch: process.env.watch || false

  }
};

var deploy = process.env.WORK_DIR;
if (deploy) {
	deploy += '/work/webapps/'
} else {
	deploy = 'build'
}


var options = minimist(process.argv.slice(2), knownOptions);
var bower_json = JSON.parse(fs.readFileSync('./bower.json', 'utf8'));
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
var prod = options.env === 'production'
var main =  '../build/' + pkg.mainFile;
var SOURCES = pkg.concatDist;
if (SOURCES == null) {
	SOURCES = "src/**/*.js"
}
var port = pkg.port || 8000;

var replaceAll = lazypipe()
	.pipe(function() {return replace('@@version', pkg.version)})
	.pipe(function() {return replace('@@js_suffix', '.js?rel=' + new Date().getTime())})
	.pipe(function() {return replace('@@css_suffix', '.css?rel=' + new Date().getTime())})
	.pipe(function() {return replace('@@timestamp', new Date().toString())})	


var jsPipleline = lazypipe()
	.pipe(plumber)
	.pipe(babel)	
	.pipe(replaceAll)
	.pipe(addsrc, 'dist/templates/*.js')

var compile_handlerbars = lazypipe()



var bower = function() {
	var opts = {};
	if (_.size(bower.overrides) > 0 ) {
		return gulp.src('./bower.json').pipe(mainBowerFiles( {overrides: bower.overrides}))
	}
	return gulp.src('./bower.json').pipe(mainBowerFiles())
	
}

bower_concat = function(expr, name, cb) {
	var js = bower()
		.pipe(expr)
		.pipe(filter('**/*.js'))
		.pipe(sourcemaps.init())
		.pipe(gulpif(prod, uglify())) 
		.pipe(concat(name + '.js'))		
		.pipe(sourcemaps.write('.'))		
		.pipe(gulp.dest('build'))
		.pipe(gzip())
		.pipe(gulp.dest('build'))

	var css = bower()
		.pipe(expr)
		.pipe(filter('**/*.css'))		
		.pipe(concat(name + '.css'))
		.pipe(gulp.dest('build'))
		.pipe(gzip())
		.pipe(gulp.dest('build'))

	var other = bower()
		.pipe(expr)
		.pipe(filter(['**/*', '!**/*.css', '!**/*.js', '!**/*.less']))	
		.pipe(flatten())	
		.pipe(gulp.dest('build'))

	return merge(js, css, other)
}


var build = function(pipe) {
	return pipe
	  	.pipe(sourcemaps.init())
		.pipe(babel())
	    .pipe(replaceAll())
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
			.pipe(livereload())
	 
})

gulp.task('sprites', function() {
	del.sync("sprites/build/*")
	return gulp.src('sprites/**/*')				
				.pipe(glue({
					url: './',
			        css: 'sprites/build/',
			        img: 'sprites/build/'
    		}))
})
gulp.task('sass', function(cb) {
	return gulp.src('style/*.sass')
			.pipe(sass.sync())
			.pipe(gulp.dest('dist'))
});

gulp.task('less', function(cb) {
	return gulp.src('style/theme.less')
			.pipe(debug())
			.pipe(less())
			.pipe(gulp.dest('build'))

});

gulp.task('css', function(cb) {
		return gulp.src(['dist/*.css', 'sprites/build/*.css', 'style/*.css'])
			.pipe(concat(main + ".css"))
			.pipe(addsrc('sprites/build/*.png'))
			.pipe(gulp.dest('build'))
			.pipe(gzip())
			.pipe(gulp.dest('build'))
});


gulp.task('styles', function(cb) {
	runSequence(['less', 'sass'], 'css', cb)
})

gulp.task("dependencies",  function(cb) {

	var bower_excludes = _.map(bower_json.excludes, function(it) {return "**/" + it + "/**/*"})
	var bower_standalone = _.map(bower_json.standalone, function(it) {return "**/" + it + "/**/*"})

	for (var i = 0; i < _.size(bower_json.standalone); i++) {
		bower_concat(filter('**/' + bower_json.standalone [i] + "/**/*"), bower_json.standalone[i])
	}	

	_.each(bower_json.directories || {}, function(dir, dep) {
		var base = "bower_components/" + dep;
			gulp.src(base+ "/" + dir,  {base:base}).pipe(gulp.dest('build/'))

	});

	if (_.size(bower_json.excludes) > 0 || _.size(bower_json.standalone) > 0) {
		bower_concat(ignore.exclude(_.union(bower_excludes, bower_standalone)), 'dependencies', cb)
	}  else {
		bower_concat(gutil.noop(), 'dependencies', cb)
	}
});

gulp.task("war",  ['bundle', 'resources', 'styles'], function() {
	del.sync('build/' + pkg.name + ".war")
	console.log('Deploying to ' + deploy)
	return gulp.src("build/**/*")
			.pipe(addsrc("dist/*.png")) // sprites
			.pipe(gulpif(prod, gzip()))
			.pipe(zip(pkg.name + ".war"))
			.pipe(gulp.dest(deploy))
})

gulp.task('resources', function() {
	var other = gulp.src('resources/**/*')
	.pipe(gulp.dest("build"))
	.pipe(replaceAll())

	var html = gulp.src("*.html")
				.pipe(replaceAll())
				.pipe(gulp.dest("build"))

	return html;

});

gulp.task("serve", function() {
	 gulp.src('dist')
    .pipe(webserver({
      port: port,
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


gulp.task("watch", function() {
	gulp.watch('src/**/*.hbs', ['templates']);
	gulp.watch('styles/*.sass', ['sass'])
	gulp.watch('styles/*.less', ['less'])
	gulp.watch('*.html',['war'])
	gulp.watch('src/**/*.js',['compile'])
})


gulp.task('bundle', function() {
	var dist = [];
	_.each(SOURCES, function(it) {dist.push(it.replace('src/', 'dist/'))})
	
	return gulp.src(["dist/**/*.js", "dist/templates/*.js"])	
		.pipe(resolve())	
    	.pipe(sourcemaps.init())
		.pipe(gulpif(prod, uglify()))
		.pipe(gulpif(options.watch, pseudoconcat(main + ".js", {webRoot: 'src', host: 'http://localhost:' + port + '/'}), concat(main + ".js")))			
		.pipe(gulpif(options.watch, replace('/dist/', '/')))		
		.pipe(gulpif(options.watch, replace( 'http://localhost:' + port + '/../', 'http://localhost:' + port + '/')))
    	.pipe(sourcemaps.write('.'))
    	.pipe(gulp.dest('build/'))
    	.pipe(gzip())
		.pipe(gulp.dest('build/'))
})

var DEST = 'dist';
gulp.task("compile", function() {
	return gulp.src("src/**/*.js")		
    	.pipe(sourcemaps.init())
		.pipe(changed(DEST))
		.pipe(debug())
		.pipe(jsPipleline())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/'))
		.pipe(livereload())
		
})

gulp.task('default', ['serve','watch']);

gulp.task("deploy", function(cb) {
	runSequence('clean', 'templates', ['compile', 'dependencies', 'resources', 'styles'], 'bundle', 'war',  function() {
		gulp.run('war')
	})
});

