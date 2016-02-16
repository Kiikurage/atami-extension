'use strict';

let gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	path = require('path'),
	runSequence = require('run-sequence'),
	named = require('vinyl-named'),
	notifier = require('node-notifier');

function handleError(err) {
	notifier.notify({
		title: `Error: ${err.plugin}`,
		message: err.message
	});

	this.emit('end');
}

gulp.task('clean', () => {
	return gulp.src('build')
		.pipe($.clean())
});

gulp.task('static', () => {
	return gulp.src([
			'src/manifest.json'
		])
		.pipe(gulp.dest('build'));
});

gulp.task('sass', () => {
	return gulp.src(['src/*.scss'])
		.pipe($.sass().on('error', handleError))
		.pipe($.autoprefixer())
		.pipe(gulp.dest('build'));
});

gulp.task('js', () => {
	let webpackConfig = require('./webpack.config.js');

	return gulp.src('src/*.js')
		.pipe(named())
		.pipe($.webpack(webpackConfig).on('error', handleError))
		.pipe(gulp.dest('build/'))
});

gulp.task('watch', () => {
	$.livereload.listen();

	gulp.watch([
		'build/manifest.json',
		'build/*.js',
		'build/*.scss',
	]).on('change', $.livereload.reload);

	gulp.watch(['src/manifest.json'], ['static']);
	gulp.watch(['src/**/*.js'], ['js']);
	gulp.watch(['src/**/*.scss'], ['sass']);
});

gulp.task('default', (callback) => {
	runSequence(
		'clean', ['static', 'sass', 'js'], 'watch',
		callback
	);
});
