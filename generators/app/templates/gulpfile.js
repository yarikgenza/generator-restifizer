'use strict';

require('app-module-path').addPath(__dirname);

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const minimist = require('minimist');

const knownOptions = {
  string: 'params',
  default: {
    params: '',
  },
};

const options = minimist(process.argv.slice(2), knownOptions);

const sources = {
  server: {
    js: [
      'runner.js',
      'migrate-db.js',
      'server.js',
      'config/**/*.js',
      'app/**/*.js',
      'test/**/*.js',
      'migrations/**/*.js',
    ],
  },
};

const debugPort = process.env.DEBUG_PORT || 5858;

gulp.task('eslint', () => gulp.src(sources.server.js)
  .pipe($.plumber())
  .pipe($.eslint())
  .pipe($.eslint.format())
  .pipe($.eslint.failAfterError()));

gulp.task('lint', ['eslint']);

gulp.task('watch', [], () => {
  const readDelay = 2000;
  $.nodemon({
    script: 'runner.js',
    args: ['server'],
    ext: 'js',
    nodeArgs: [`--inspect=${debugPort}`],
    watch: sources.server.js,
  }).on('change', ['eslint', 'apidoc']);

  return gulp.watch(sources.server.js, {
    debounceDelay: readDelay,
  }, ['eslint', 'apidoc']);
});

gulp.task('migrate', () => $.run(`node runner.js migrate-db.js ${options.params}`).exec());

gulp.task('apidoc', (done) => {
  $.apidoc({
    config: '.',
    src: 'app/',
    dest: 'apidocs/',
    includeFilters: ['.*\\.js$'],
  }, done);
});

gulp.task('test', async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Wrong NODE_ENV value. Tests must be run with "test"');
  }
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require('test/test')(options.params);
});

gulp.task('install', ['migrate', 'apidoc']);

// eslint-disable-next-line import/no-dynamic-require, global-require
gulp.task('run', () => require('server')(options.params));

gulp.task('dev', ['lint', 'watch']);

gulp.task('default', [process.env.NODE_ENV === 'production' ? 'run' : 'dev']);
