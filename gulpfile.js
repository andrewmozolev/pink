'use strict';

var gulp         = require('gulp');

var sass         = require('gulp-sass');
var plumber      = require('gulp-plumber');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var reporter     = require('postcss-reporter');
var syntax_scss  = require('postcss-scss');
var flexboxfixer = require('postcss-flexboxfixer');
var cssnano      = require('cssnano');
var mqpacker     = require('css-mqpacker');
var stylelint    = require('stylelint');
var sourcemaps   = require('gulp-sourcemaps');

var rename       = require('gulp-rename');
var gulpIf       = require('gulp-if');
var browserSync  = require('browser-sync');
var notify       = require('gulp-notify');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var imagemin     = require('gulp-imagemin');
var pngquant     = require('imagemin-pngquant');
var svgSprite    = require('gulp-svg-sprite');
var fs           = require('fs'); // встроенный в node модуль, устанавливать не надо
var foldero      = require('foldero'); // плагин
var jade         = require('gulp-jade');
var runSequence  = require('run-sequence');
var del          = require('del');
var ghPages      = require('gulp-gh-pages');
var dataPath     = 'src/jade/_data'; // Где лежат файлы

var argv = require('minimist')(process.argv.slice(2));

var path = require('path');

var isOnProduction = !!argv.production;
var buildPath      = isOnProduction ? 'build' : 'tmp';
var srcPath        = 'src/';





/* ==============================
=            DEPLOY             =
============================== */

gulp.task('deploy', function() {
  return gulp.src('**/*', {cwd: buildPath})
  .pipe(ghPages());
});

/* =====  End of DEPLOY  ====== */





/* ============================
=            JADE             =
============================ */

gulp.task('jade', function() {
  // в этой переменной копим данные
  var siteData = {};

  // проверяем, есть ли по заданному пути папка
  if (fs.existsSync(dataPath)) {

    // берем и пишем в siteData
    siteData = foldero(dataPath, {
      recurse: true,
      whitelist: '(.*/)*.+\.(json)$', //... все json файлы
      // так обрабатываем каждый файл:
      loader: function loadAsString(file) {
        var json = {}; // сюда будем писать значения
        // пробуем извлечь из файла json
        try {
          json = JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        // ругаемся, если в файле лежит плохой json
        catch(e) {
          console.log('Error Parsing JSON file: ' + file);
          console.log('==== Details Below ====');
          console.log(e);
        }
        // а если все ок, то добавляем его в siteData
        return json;
      }
    });
  }

  // только тут начался галп
  return gulp.src('**/*.jade', {cwd: path.join(srcPath, 'jade/_pages')})
  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))

  .pipe(jade({
    locals: {
      site: {
        data: siteData // переменные будут доступны в site.data
      }
    },
    pretty: true
  }))
  .pipe(gulp.dest(buildPath))
  .pipe(notify({
    message:'Jade complite: <%= file.relative %>!',
    sound: 'Pop'
  }));
});

/* =====  End of JADE  ====== */





/*=======================================
=              SVG-SPRITE               =
=======================================*/

gulp.task('svg', function() {
  return gulp.src('**/*.svg', {cwd: path.join(srcPath, 'img/svg-sprite')})
  .pipe(svgSprite({
    mode: {
      symbol: {
        dest: '.',
        dimensions: '%s',
        sprite: buildPath + '/img/svg-sprite.svg',
        example: false,
        render: {scss: {dest: 'src/sass/_global/svg-sprite.scss'}}
      }
    },
    svg: {
      xmlDeclaration: false,
      doctypeDeclaration: false
    }
  }))
  .pipe(gulp.dest('./'));
});

/*========  End of SVG-SPRITE  ========*/





/*===================================
=            Gulp IMAGES            =
===================================*/

gulp.task('img', function() {
  return gulp.src(['!svg-sprite/*.*', '**/*.*'], {cwd: path.join(srcPath, 'img')})
  .pipe(gulpIf(isOnProduction, imagemin({
    progressive: true,
    svgoPlugins: [
    {removeViewBox: false},
    {cleanupIDs: false}
    ],
    use: [pngquant()]
  })))

  .pipe(gulp.dest(buildPath + '/img'));
});

/*=====  End of Gulp IMAGES  ======*/





/*===============================
=               JS              =
===============================*/

gulp.task('js', function() {
  return gulp.src(['lib/**', 'modules/**', 'scripts.js'], {cwd: path.join(srcPath, 'js')})
  .pipe(plumber({
    errorHandler: notify.onError('Error: <%= error.message %>')
  }))
  .pipe(gulpIf(!isOnProduction, sourcemaps.init()))
  .pipe(concat('scripts.js'))
  .pipe(gulpIf(!isOnProduction, gulp.dest(path.join(buildPath, 'js'))))
  .pipe(uglify())
  .pipe(rename('scripts.min.js'))
  .pipe(gulpIf(!isOnProduction, sourcemaps.write('./')))
  .pipe(gulp.dest(path.join(buildPath, 'js')))
  .pipe(notify({
    message:'JS complite: <%= file.relative %>!',
    sound: 'Pop'
  }));
});

/*=======  End of JS  ========*/





/* =================================
=            STYLETEST           =
================================= */

gulp.task('styletest', function() {
  var processors = [
  stylelint(),
  reporter({
    throwError: true
  })
  ];
  return gulp.src(['!src/sass/_global/svg-sprite.scss', 'src/sass/**/*.scss'])

  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))
  .pipe(postcss(processors, {syntax: syntax_scss}));
});

/* =====  End of STYLETEST  ====== */





/*=================================
=            Gulp SASS            =
=================================*/

gulp.task('style', function() {
  return gulp.src('style.scss', {cwd: path.join(srcPath, 'sass')})
  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))
  .pipe(gulpIf(!isOnProduction, sourcemaps.init()))
  .pipe(sass())
  .pipe(postcss([
    flexboxfixer,
    autoprefixer({browsers: [
      'last 1 version',
      'last 2 Chrome versions',
      'last 2 Firefox versions',
      'last 2 Opera versions',
      'last 2 Edge versions'
      ]}),
    mqpacker,
    cssnano({safe:true})
    ]))
  .pipe(rename('style.min.css'))
  .pipe(gulpIf(!isOnProduction, sourcemaps.write('./')))
  .pipe(gulp.dest(path.join(buildPath, '/css')))
  .pipe(browserSync.stream({match: '**/*.css'}))
  .pipe(notify({
    message:'SCSS complite: <%= file.relative %>!',
    sound: 'Pop'
  }));
});

/*=====  End of Gulp SASS  ======*/





/* ==================================
=            Gulp FONTS            =
================================== */

gulp.task('fonts', function() {
  return gulp.src('**/*.*', {cwd: path.join(srcPath, 'fonts')})
  .pipe(gulp.dest(buildPath + '/fonts'));
});

/* =====  End of Gulp FONTS  ====== */





/* ===========================
=            DEL            =
=========================== */

gulp.task('del', function() {
  return del([path.join(buildPath), path.join(srcPath, 'sass/_global/svg-sprite.scss')]).then(paths => {
    console.log('Deleted files and folders:\n', paths.join('\n'));
  });
});

/* =====  End of DEL  ====== */





/* ==================================
=            BROWSERSYNC            =
================================== */

gulp.task('server', function() {
  browserSync.init({
    server: {
      baseDir: buildPath
    },
    notify: false,
    open: false,
    ui: false
  });
});

/* =====  End of BROWSERSYNC  ====== */





/* =============================
=            BUILD             =
============================= */

gulp.task('build', ['del'], function (callback) {
  runSequence(
    'svg',
    'jade',
    'js',
    'img',
    'fonts',
    'style',
    callback);
});

/* =====  End of BUILD  ====== */





/* ===============================
=            DEFAULT             =
=============================== */

gulp.task('default', ['build'], function() {
  if (isOnProduction) {
    gulp.start('deploy');
  }
  if (!isOnProduction) {
    gulp.start('server');
    gulp.watch('**/*.scss', {cwd: path.join(srcPath, 'sass')}, ['style', browserSync.stream]);
    gulp.watch(['**/*.jade', '**/*.json'], {cwd: path.join(srcPath, 'jade')}, ['jade', browserSync.reload]);
    gulp.watch('**/*.js', {cwd: path.join(srcPath, 'js')}, ['js', browserSync.reload]);
    gulp.watch('**/*.svg', {cwd: path.join(srcPath, 'img/svg-sprite')}, ['svg', browserSync.reload]);
    gulp.watch(['**/*.*','!svg-sprite/**'], {cwd: path.join(srcPath, 'img')}, ['img', browserSync.reload]);
    gulp.watch('**/*.*', {cwd: path.join(srcPath, 'fonts')}, ['fonts', browserSync.reload]);
  }
});

/* =====  End of DEFAULT  ====== */
