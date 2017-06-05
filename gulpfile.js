var tsc = require('gulp-tsc');
var copy = require('gulp-copy');
var gulp = require('gulp');
var path = require('path');
var es = require('event-stream');
var path = require('path');

function toFileUri(filePath) {
	const match = filePath.match(/^([a-z])\:(.*)$/i);

	if (match) {
		filePath = '/' + match[1].toUpperCase() + ':' + match[2];
	}

	return 'file://' + filePath.replace(/\\/g, '/');
}

const rootDir = path.join(__dirname, './src');
const options = require('./src/tsconfig.json').compilerOptions;
options.verbose = false;
// options.sourceMap = false;
// options.rootDir = rootDir;
// options.sourceRoot = toFileUri(rootDir);

console.log(options);
// create and keep compiler 
// var compilation = tsb.create(options);

gulp.task('default', ['watch']);

gulp.task('build', function () {
	const src = es.merge(
		gulp.src(['src/**/*', '!src/**/*.ts'], { base: './src' }),
		gulp.src('src/**/*.ts')
		.pipe(tsc(options))
	);
	return src
		.pipe(gulp.dest('out'));
});

gulp.task('watch', ['build'], function () {
	gulp.watch('src/**/*', (event) => {
		console.log(event.path + ' changed');

		var src;
		console.log('extension is ' + path.extname(event.path));
		if (path.extname(event.path) == '.ts') {
			console.log('compiling typescript file')
			src = gulp.src(event.path, {base: 'src'}).pipe(tsc());
		}
		else {
			console.log('copying file');
			src = gulp.src(event.path, {base: 'src'});
		}
			console.log(event.path);		
		return src
			.pipe(gulp.dest('out'), {overwrite: true});
	});
});